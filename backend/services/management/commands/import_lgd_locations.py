import os
import csv
import json
import time
import hashlib
import unicodedata
from django.core.management.base import BaseCommand
from django.db import transaction, connection
from django.utils import timezone
from services.models import (
    DatasetVersion, State, District, SubDistrict,
    DevelopmentBlock, LocalBody, Ward, Village,
    LocationMapping, QuarantineLocationRecord
)

def clean_text(val):
    if not val:
        return ''
    s = unicodedata.normalize('NFKC', str(val)).strip()
    return ' '.join(s.split())

def title_case(val):
    s = clean_text(val)
    if not s:
        return ''
    if s.isupper():
        return s.title()
    return s


class Command(BaseCommand):
    help = "Transactional, duplicate-safe importer for official Pan-India LGD location datasets."

    def add_arguments(self, parser):
        parser.add_argument(
            '--data-dir',
            type=str,
            default='research/location_data/raw',
            help='Directory containing official raw LGD CSV files.'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Validate and parse data without saving changes to the database.'
        )
        parser.add_argument(
            '--state',
            type=str,
            default='',
            help='Filter import to a specific State / UT name or code.'
        )
        parser.add_argument(
            '--limit-villages',
            type=int,
            default=0,
            help='Optional limit on the number of villages to import (0 for full nationwide import).'
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=5000,
            help='Batch size for bulk_create operations.'
        )

    def handle(self, *args, **options):
        data_dir = options['data_dir']
        dry_run = options['dry_run']
        state_filter = options['state'].strip()
        limit_villages = options['limit_villages']
        batch_size = options['batch_size']

        start_time = time.time()
        self.stdout.write(self.style.NOTICE(
            f"=== KRISHISEVA PAN-INDIA LGD LOCATION INGESTION ENGINE ==="
            f"\nData Directory: {data_dir}"
            f"\nDry Run Mode: {dry_run}"
            f"\nState Filter: {state_filter or 'All 36 States & UTs (Pan-India)'}"
        ))

        # Check required files
        req_files = [
            '1-state.csv', '2-district.csv', '3-subdistrict.csv',
            'blocks.csv', 'urban-local-body.csv', '4-village.csv'
        ]
        for f in req_files:
            fp = os.path.join(data_dir, f)
            if not os.path.exists(fp):
                self.stderr.write(f"Missing required data file: {fp}")
                return

        try:
            with transaction.atomic():
                stats = self._execute_import(data_dir, dry_run, state_filter, limit_villages, batch_size)
                if dry_run:
                    self.stdout.write(self.style.WARNING("Dry run mode active: rolling back transaction."))
                    transaction.set_rollback(True)
        except Exception as e:
            self.stderr.write(f"Fatal error during location ingestion: {e}")
            raise e

        elapsed = time.time() - start_time
        self.stdout.write(self.style.SUCCESS(
            f"\n=== INGESTION SUMMARY REPORT (Elapsed: {elapsed:.2f}s) ===\n"
            f"  - Dataset Version Registered: {stats.get('dataset_version')}\n"
            f"  - States / UTs Imported: {stats.get('states_count', 0)}\n"
            f"  - Districts Imported: {stats.get('districts_count', 0)}\n"
            f"  - Sub-Districts (Tehsils) Imported: {stats.get('subdistricts_count', 0)}\n"
            f"  - Development Blocks Imported: {stats.get('blocks_count', 0)}\n"
            f"  - Local Bodies (Urban/Traditional) Imported: {stats.get('local_bodies_count', 0)}\n"
            f"  - Villages Imported / Updated: {stats.get('villages_count', 0)}\n"
            f"  - Location Mappings Recorded: {stats.get('mappings_count', 0)}\n"
            f"  - Existing Meerut Records Reconciled: {stats.get('meerut_reconciled', 0)}\n"
            f"  - Quarantined Anomalies: {stats.get('quarantine_count', 0)}"
        ))

    def _execute_import(self, data_dir, dry_run, state_filter, limit_villages, batch_size):
        stats = {}

        # 1. Register Dataset Version
        manifest_path = os.path.join(data_dir, 'download_manifest.json')
        manifest_data = {}
        if os.path.exists(manifest_path):
            with open(manifest_path, 'r', encoding='utf-8') as f:
                manifest_data = json.load(f)

        state_csv_path = os.path.join(data_dir, '1-state.csv')
        with open(state_csv_path, 'rb') as f:
            state_hash = hashlib.sha256(f.read()).hexdigest()

        if not dry_run:
            ds_ver, _ = DatasetVersion.objects.update_or_create(
                name='LGD_PAN_INDIA_OFFICIAL_DIRECTORY',
                defaults={
                    'source_url': 'https://lgdirectory.gov.in / planemad-lgd-mirror',
                    'download_date': timezone.localdate(),
                    'dataset_version': 'LGD-2026-V1-EXPANDED',
                    'licence': 'Government Open Data License – India (NDSAP)',
                    'file_hash': state_hash,
                    'is_active': True,
                    'metadata': manifest_data
                }
            )
            stats['dataset_version'] = ds_ver.name
        else:
            stats['dataset_version'] = 'LGD_PAN_INDIA_OFFICIAL_DIRECTORY (Dry-run simulated)'

        # 2. States Import
        self.stdout.write("-> Importing States and Union Territories...")
        state_map = {} # lgd_code -> State instance
        state_objs_to_create = []

        with open(state_csv_path, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.reader(f)
            header = next(reader, [])
            for r in reader:
                if len(r) >= 8 and r[1].isdigit():
                    code = int(r[1])
                    name = title_case(r[3])
                    name_loc = clean_text(r[4])
                    c2001 = clean_text(r[5])
                    c2011 = clean_text(r[6])
                    ut = 'UT' if r[7].strip().upper() == 'U' else 'State'
                    ver = int(r[2]) if r[2].isdigit() else 1

                    if state_filter and (state_filter.lower() not in name.lower() and str(code) != state_filter):
                        continue

                    state_objs_to_create.append(State(
                        lgd_code=code,
                        name_en=name,
                        name_local=name_loc,
                        state_or_ut=ut,
                        census_2001_code=c2001,
                        census_2011_code=c2011,
                        version=ver
                    ))

        if not dry_run:
            for s in state_objs_to_create:
                obj, _ = State.objects.update_or_create(
                    lgd_code=s.lgd_code,
                    defaults={
                        'name_en': s.name_en,
                        'name_local': s.name_local,
                        'state_or_ut': s.state_or_ut,
                        'census_2001_code': s.census_2001_code,
                        'census_2011_code': s.census_2011_code,
                        'version': s.version
                    }
                )
                state_map[s.lgd_code] = obj
        else:
            for s in state_objs_to_create:
                state_map[s.lgd_code] = s

        stats['states_count'] = len(state_map)
        self.stdout.write(f"   Indexed {len(state_map)} States & UTs.")

        # 3. Districts Import
        self.stdout.write("-> Importing Districts...")
        district_csv_path = os.path.join(data_dir, '2-district.csv')
        district_map = {} # lgd_code -> District instance
        district_objs_to_create = []

        with open(district_csv_path, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.reader(f)
            header = next(reader, [])
            for r in reader:
                if len(r) >= 6 and r[2].isdigit() and r[0].isdigit():
                    scode = int(r[0])
                    dcode = int(r[2])
                    dname = title_case(r[3])
                    c2001 = clean_text(r[4])
                    c2011 = clean_text(r[5])

                    state_obj = state_map.get(scode)
                    if not state_obj:
                        continue # skipped if outside state filter

                    district_objs_to_create.append(District(
                        lgd_code=dcode,
                        state=state_obj,
                        name_en=dname,
                        census_2001_code=c2001,
                        census_2011_code=c2011
                    ))

        if not dry_run:
            for d in district_objs_to_create:
                obj, _ = District.objects.update_or_create(
                    lgd_code=d.lgd_code,
                    defaults={
                        'state': d.state,
                        'name_en': d.name_en,
                        'census_2001_code': d.census_2001_code,
                        'census_2011_code': d.census_2011_code
                    }
                )
                district_map[d.lgd_code] = obj
        else:
            for d in district_objs_to_create:
                district_map[d.lgd_code] = d

        stats['districts_count'] = len(district_map)
        self.stdout.write(f"   Indexed {len(district_map)} Districts.")

        # 4. Sub-Districts (Tehsils) Import
        self.stdout.write("-> Importing Sub-Districts (Tehsils / Talukas)...")
        subdist_csv_path = os.path.join(data_dir, '3-subdistrict.csv')
        subdistrict_map = {} # lgd_code -> SubDistrict instance
        subdist_objs = []

        with open(subdist_csv_path, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.reader(f)
            header = next(reader, [])
            for r in reader:
                if len(r) >= 8 and r[5].isdigit() and r[3].isdigit():
                    dcode = int(r[3])
                    scode = int(r[5])
                    sname = title_case(r[7])
                    ver = int(r[6]) if r[6].isdigit() else 1

                    dist_obj = district_map.get(dcode)
                    if not dist_obj:
                        continue

                    subdist_objs.append(SubDistrict(
                        lgd_code=scode,
                        district=dist_obj,
                        name_en=sname,
                        version=ver
                    ))

        if not dry_run:
            for sd in subdist_objs:
                obj, _ = SubDistrict.objects.update_or_create(
                    lgd_code=sd.lgd_code,
                    defaults={
                        'district': sd.district,
                        'name_en': sd.name_en,
                        'version': sd.version
                    }
                )
                subdistrict_map[sd.lgd_code] = obj
        else:
            for sd in subdist_objs:
                subdistrict_map[sd.lgd_code] = sd

        stats['subdistricts_count'] = len(subdistrict_map)
        self.stdout.write(f"   Indexed {len(subdistrict_map)} Sub-Districts.")

        # 5. Development Blocks Import
        self.stdout.write("-> Importing Development Blocks...")
        blocks_csv_path = os.path.join(data_dir, 'blocks.csv')
        block_map = {} # lgd_code -> DevelopmentBlock instance
        block_objs = []

        with open(blocks_csv_path, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.reader(f)
            header = next(reader, [])
            for r in reader:
                if len(r) >= 8 and r[5].isdigit() and r[3].isdigit():
                    dcode = int(r[3])
                    bcode = int(r[5])
                    bname = title_case(clean_text(r[7]) or clean_text(r[8]))
                    ver = int(r[6]) if r[6].isdigit() else 1

                    dist_obj = district_map.get(dcode)
                    if not dist_obj:
                        continue

                    block_objs.append(DevelopmentBlock(
                        lgd_code=bcode,
                        district=dist_obj,
                        name_en=bname,
                        version=ver
                    ))

        if not dry_run:
            for b in block_objs:
                obj, _ = DevelopmentBlock.objects.update_or_create(
                    lgd_code=b.lgd_code,
                    defaults={
                        'district': b.district,
                        'name_en': b.name_en,
                        'version': b.version
                    }
                )
                block_map[b.lgd_code] = obj
        else:
            for b in block_objs:
                block_map[b.lgd_code] = b

        stats['blocks_count'] = len(block_map)
        self.stdout.write(f"   Indexed {len(block_map)} Development Blocks.")

        # 6. Urban, Traditional & Rural Local Bodies (Gram Panchayats) Import
        self.stdout.write("-> Importing Local Bodies (Urban, Rural & Traditional)...")
        ulb_csv_path = os.path.join(data_dir, 'urban-local-body.csv')
        lb_map = {} # lgd_code -> LocalBody instance
        lb_objs = []

        if os.path.exists(ulb_csv_path):
            with open(ulb_csv_path, 'r', encoding='utf-8', errors='ignore') as f:
                reader = csv.reader(f)
                header = next(reader, [])
                for r in reader:
                    if len(r) >= 8 and r[1].isdigit() and r[7].isdigit():
                        code = int(r[1])
                        scode = int(r[7])
                        name = title_case(r[3])
                        name_loc = clean_text(r[4])
                        type_code = int(r[5]) if r[5].isdigit() else None
                        c2011 = clean_text(r[6])

                        state_obj = state_map.get(scode)
                        if not state_obj:
                            continue

                        lb_objs.append(LocalBody(
                            lgd_code=code,
                            state=state_obj,
                            name_en=name,
                            name_local=name_loc,
                            local_body_type='urban',
                            local_body_type_code=type_code,
                            census_2011_code=c2011
                        ))

        tlb_csv_path = os.path.join(data_dir, 'traditional-local-body.csv')
        if os.path.exists(tlb_csv_path):
            with open(tlb_csv_path, 'r', encoding='utf-8', errors='ignore') as f:
                reader = csv.reader(f)
                header = next(reader, [])
                for r in reader:
                    if len(r) >= 9 and r[0].isdigit() and r[8].isdigit():
                        code = int(r[0])
                        scode = int(r[8])
                        name = title_case(r[2])
                        name_loc = clean_text(r[3])
                        type_code = int(r[4]) if r[4].isdigit() else None
                        type_name = clean_text(r[5])

                        state_obj = state_map.get(scode)
                        if not state_obj:
                            continue

                        lb_objs.append(LocalBody(
                            lgd_code=code,
                            state=state_obj,
                            name_en=name,
                            name_local=name_loc,
                            local_body_type='traditional',
                            local_body_type_code=type_code,
                            local_body_type_name=type_name
                        ))

        # Rural Local Bodies (Gram Panchayats & Block/District Panchayats)
        rlb_csv_path = os.path.join(data_dir, 'rural-local-body.csv')
        if os.path.exists(rlb_csv_path):
            with open(rlb_csv_path, 'r', encoding='utf-8', errors='ignore') as f:
                reader = csv.reader(f)
                header = next(reader, [])
                for r in reader:
                    if len(r) >= 9 and r[0].isdigit() and r[8].isdigit():
                        code = int(r[0])
                        scode = int(r[8])
                        name = title_case(r[2])
                        name_loc = clean_text(r[3])
                        type_code = int(r[4]) if r[4].isdigit() else None
                        type_name = clean_text(r[5])
                        parent_code = int(r[6]) if r[6].isdigit() and int(r[6]) > 0 else (int(r[7]) if r[7].isdigit() and int(r[7]) > 0 else None)

                        state_obj = state_map.get(scode)
                        if not state_obj:
                            continue

                        lb_objs.append(LocalBody(
                            lgd_code=code,
                            state=state_obj,
                            name_en=name,
                            name_local=name_loc,
                            local_body_type='rural',
                            local_body_type_code=type_code,
                            local_body_type_name=type_name,
                            parent_local_body_code=parent_code
                        ))

        if not dry_run:
            for lb in lb_objs:
                obj, _ = LocalBody.objects.update_or_create(
                    lgd_code=lb.lgd_code,
                    defaults={
                        'state': lb.state,
                        'name_en': lb.name_en,
                        'name_local': lb.name_local,
                        'local_body_type': lb.local_body_type,
                        'local_body_type_code': lb.local_body_type_code,
                        'local_body_type_name': lb.local_body_type_name,
                        'parent_local_body_code': lb.parent_local_body_code,
                        'census_2011_code': lb.census_2011_code
                    }
                )
                lb_map[lb.lgd_code] = obj
        else:
            for lb in lb_objs:
                lb_map[lb.lgd_code] = lb

        stats['local_bodies_count'] = len(lb_map)
        self.stdout.write(f"   Indexed {len(lb_map)} Local Bodies (Urban, Rural & Traditional).")

        # 6B. Wards Import
        self.stdout.write("-> Importing Wards...")
        ward_objs = []
        ward_count = 0
        for ward_file in ['karnataka-urban-ward.csv', 'karnataka-rural-ward.csv']:
            wpath = os.path.join(data_dir, ward_file)
            if os.path.exists(wpath):
                with open(wpath, 'r', encoding='utf-8', errors='ignore') as f:
                    reader = csv.reader(f)
                    header = next(reader, [])
                    for r in reader:
                        if len(r) >= 4 and r[1].isdigit():
                            lb_code = int(r[1])
                            w_num = clean_text(r[2])
                            w_name = title_case(r[3])
                            w_code = f"W-{lb_code}-{w_num}"

                            lb_inst = lb_map.get(lb_code)
                            if not lb_inst:
                                continue

                            ward_objs.append(Ward(
                                ward_code=w_code,
                                local_body=lb_inst,
                                ward_number=w_num,
                                ward_name=w_name
                            ))

        if not dry_run and ward_objs:
            Ward.objects.bulk_create(ward_objs, batch_size=batch_size, ignore_conflicts=True)
            ward_count = len(ward_objs)
        else:
            ward_count = len(ward_objs)
        stats['wards_count'] = ward_count
        self.stdout.write(f"   Indexed {ward_count} Wards.")

        # 7. Reconcile Existing Meerut Villages
        self.stdout.write("-> Reconciling existing Meerut records...")
        existing_meerut = Village.objects.filter(district__iexact='Meerut')
        meerut_reconciled = 0
        unmatched_count = 0

        # Known confirmed LGD mapping for baseline Meerut entries
        CONFIRMED_MEERUT_MAP = {
            'daurala': 941836,
            'mawana': 118755,
            'sardhana': 118625,
            'hastinapur': 118802,
            'jani': 119080,
            'partapur': 118849,
        }

        if not dry_run:
            up_state = State.objects.filter(name_en__iexact='Uttar Pradesh').first()
            meerut_dist = District.objects.filter(name_en__iexact='Meerut').first()

            for v in existing_meerut:
                v_lower = v.name.strip().lower()
                matched_code = None
                for k, code in CONFIRMED_MEERUT_MAP.items():
                    if k in v_lower:
                        matched_code = code
                        break

                if matched_code:
                    v.lgd_code = matched_code
                    if meerut_dist:
                        v.district_ref = meerut_dist
                    if up_state:
                        v.state_ref = up_state
                    v.save()
                    meerut_reconciled += 1
                else:
                    unmatched_count += 1
                    QuarantineLocationRecord.objects.create(
                        source_file='existing_meerut_reconciliation',
                        raw_data={'id': v.id, 'name': v.name, 'district': v.district, 'state': v.state},
                        reason='Unmatched baseline village without confirmed LGD identifier'
                    )

        stats['meerut_reconciled'] = meerut_reconciled
        self.stdout.write(f"   Confirmed and reconciled {meerut_reconciled} existing Meerut records.")

        # 8. Villages Import (Full Nationwide or Filtered)
        self.stdout.write("-> Ingesting Villages (National LGD Registry)...")
        village_csv_path = os.path.join(data_dir, '4-village.csv')
        total_villages_processed = 0
        quarantined = 0
        village_batch = []

        # Cache existing LGD codes to prevent duplicate insert attempts
        existing_lgd_codes = set()
        if not dry_run:
            existing_lgd_codes = set(Village.objects.exclude(lgd_code__isnull=True).values_list('lgd_code', flat=True))

        with open(village_csv_path, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.reader(f)
            header = next(reader, [])
            for r in reader:
                if len(r) < 14:
                    quarantined += 1
                    continue

                vcode_str = r[5].strip()
                sub_str = r[3].strip()
                dist_str = r[1].strip()
                state_str = r[12].strip()

                if not (vcode_str.isdigit() and sub_str.isdigit() and dist_str.isdigit()):
                    quarantined += 1
                    continue

                vcode = int(vcode_str)
                sub_code = int(sub_str)
                dist_code = int(dist_str)
                state_code = int(state_str) if state_str.isdigit() else 0

                vname = clean_text(r[7])
                if not vname:
                    vname = clean_text(r[8]) or f"Village {vcode}"
                vname = title_case(vname)
                vname_loc = clean_text(r[8])
                vstatus = clean_text(r[9]) or 'Inhabitant'
                c2001 = clean_text(r[10])
                c2011 = clean_text(r[11])
                ver = int(r[6]) if r[6].isdigit() else 1
                dist_name = title_case(r[2])
                st_name = title_case(r[13])

                if state_filter and (state_filter.lower() not in st_name.lower() and str(state_code) != state_filter):
                    continue

                if vcode in existing_lgd_codes:
                    continue

                sub_obj = subdistrict_map.get(sub_code)
                dist_obj = district_map.get(dist_code)
                st_obj = state_map.get(state_code)

                # Create Village instance
                village_batch.append(Village(
                    name=vname,
                    name_local=vname_loc,
                    lgd_code=vcode,
                    subdistrict=sub_obj,
                    district_ref=dist_obj,
                    state_ref=st_obj,
                    district=dist_name,
                    state=st_name,
                    village_status=vstatus,
                    census_2001_code=c2001,
                    census_2011_code=c2011,
                    version=ver
                ))
                existing_lgd_codes.add(vcode)
                total_villages_processed += 1

                if len(village_batch) >= batch_size:
                    if not dry_run:
                        Village.objects.bulk_create(village_batch, batch_size=batch_size, ignore_conflicts=True)
                    self.stdout.write(f"   Processed {total_villages_processed} villages...")
                    village_batch = []

                if limit_villages > 0 and total_villages_processed >= limit_villages:
                    self.stdout.write(self.style.NOTICE(f"Reached village limit of {limit_villages}."))
                    break

            if village_batch and not dry_run:
                Village.objects.bulk_create(village_batch, batch_size=batch_size, ignore_conflicts=True)
                village_batch = []

        stats['villages_count'] = total_villages_processed
        stats['quarantine_count'] = quarantined
        self.stdout.write(f"   Total villages processed: {total_villages_processed}")

        # 9. Municipal Directory Mappings
        self.stdout.write("-> Ingesting Local Body to Village Mappings...")
        muni_csv_path = os.path.join(data_dir, 'municipal-directory.csv')
        mappings_count = 0

        if os.path.exists(muni_csv_path) and not dry_run:
            mapping_batch = []
            with open(muni_csv_path, 'r', encoding='utf-8', errors='ignore') as f:
                reader = csv.reader(f)
                header = next(reader, [])
                for r in reader:
                    if len(r) >= 11 and r[2].isdigit() and r[9].isdigit():
                        lb_code = int(r[2])
                        v_code = int(r[9])

                        lb_inst = lb_map.get(lb_code)
                        # We lookup village by lgd_code if imported
                        v_inst = Village.objects.filter(lgd_code=v_code).first()
                        if lb_inst and v_inst:
                            mapping_batch.append(LocationMapping(
                                mapping_type='village_ulb',
                                village=v_inst,
                                local_body=lb_inst,
                                is_verified=True,
                                source='MUNICIPAL_DIRECTORY_LGD'
                            ))
                            mappings_count += 1

                        if len(mapping_batch) >= batch_size:
                            LocationMapping.objects.bulk_create(mapping_batch, batch_size=batch_size, ignore_conflicts=True)
                            mapping_batch = []

                if mapping_batch:
                    LocationMapping.objects.bulk_create(mapping_batch, batch_size=batch_size, ignore_conflicts=True)

        stats['mappings_count'] = mappings_count
        self.stdout.write(f"   Total location mappings recorded: {mappings_count}")

        return stats
