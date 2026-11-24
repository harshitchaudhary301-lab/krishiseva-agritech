import os
import csv
import json
import hashlib
from pathlib import Path
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from django.conf import settings
from services.models import (
    ServiceCategory, Village, AgriculturalReferenceRecord,
    HistoricalMachineryRate, HistoricalAgriculturalWage
)

class Command(BaseCommand):
    help = "Transactional, idempotent importer for canonical agricultural reference data, 16 service categories, historical machinery rates, and wage observations."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Validate and process records without persisting database changes.'
        )
        parser.add_argument(
            '--research-dir',
            type=str,
            default=str(settings.BASE_DIR.parent / 'research'),
            help='Path to research root directory.'
        )

    def compute_sha256(self, file_path):
        if not os.path.exists(file_path):
            return None
        sha = hashlib.sha256()
        with open(file_path, 'rb') as f:
            while chunk := f.read(65536):
                sha.update(chunk)
        return sha.hexdigest()

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        research_dir = Path(options.get('research_dir'))
        
        self.stdout.write(self.style.NOTICE(
            f"Starting agricultural reference data import {'[DRY-RUN MODE]' if dry_run else ''}..."
        ))

        stats = {
            'categories': {'accepted': 0, 'skipped': 0, 'rejected': 0},
            'machinery_rates': {'accepted': 0, 'skipped': 0, 'rejected': 0},
            'wage_observations': {'accepted': 0, 'skipped': 0, 'rejected': 0},
            'reference_records': {'accepted': 0, 'skipped': 0, 'rejected': 0},
            'input_manifest': {}
        }

        # 1. File Hash Inventory
        manifest_files = [
            research_dir / 'phase02' / 'Parameter_records.csv',
            research_dir / 'phase02' / 'Agricultural_Master_Database_V2.xlsx',
            research_dir / 'phase02' / 'District_Research_Workbook.xlsx',
            research_dir / 'original_sources' / 'KrishiSeva_Phase_01_Master_Research_Report.pdf'
        ]
        for p in manifest_files:
            if p.exists():
                h = self.compute_sha256(p)
                stats['input_manifest'][p.name] = {
                    'path': str(p),
                    'sha256': h,
                    'size_bytes': p.stat().st_size
                }
                self.stdout.write(f"  [File Inventory] {p.name}: {h[:16]}... ({p.stat().st_size} bytes)")

        try:
            with transaction.atomic():
                # -----------------------------------------------------------------
                # 2. Canonical 16 Service Categories
                # -----------------------------------------------------------------
                categories_data = [
                    {
                        'slug': 'soil_testing',
                        'name_en': 'Soil Testing & Assessment',
                        'name_hi': 'मृदा परीक्षण एवं विश्लेषण',
                        'description_en': 'Certified laboratory soil testing, NPK & micronutrient profiling, pH and electrical conductivity assessment.',
                        'description_hi': 'प्रमाणित प्रयोगशाला मृदा जांच, एनपीके व सूक्ष्म पोषक तत्व, पीएच एवं लवणता विश्लेषण।',
                        'icon': 'TestTube',
                        'is_active': True,
                        'base_unit': 'Per Sample / Plot',
                        'typical_price_range': '₹300 - ₹800 / नमूना',
                        'display_order': 1,
                    },
                    {
                        'slug': 'land_preparation',
                        'name_en': 'Land Preparation',
                        'name_hi': 'खेत की जुताई एवं तैयारी',
                        'description_en': 'Primary & secondary tillage, deep ploughing, laser land leveling, and bund formation.',
                        'description_hi': 'गहरी जुताई, रोटावेटर, लेजर लैंड लेवलिंग और मेड़बंदी।',
                        'icon': 'Tractor',
                        'is_active': True,
                        'base_unit': 'Per Acre',
                        'typical_price_range': '₹800 - ₹1,800 / एकड़',
                        'display_order': 2,
                    },
                    {
                        'slug': 'input_supply',
                        'name_en': 'Agricultural Input Supply',
                        'name_hi': 'कृषि आदान एवं सामग्री आपूर्ति',
                        'description_en': 'Certified seeds, bio-fertilizers, neem cake, and farm inputs from licensed suppliers.',
                        'description_hi': 'प्रमाणित बीज, जैव उर्वरक, नीम खली एवं अनुमोदित कृषि सामग्री।',
                        'icon': 'Sprout',
                        'is_active': True,
                        'base_unit': 'Per Quintal / Bag',
                        'typical_price_range': '₹500 - ₹3,000 / बैग',
                        'display_order': 3,
                    },
                    {
                        'slug': 'sowing_planting',
                        'name_en': 'Sowing & Planting',
                        'name_hi': 'बुवाई एवं बीज रोपण',
                        'description_en': 'Seed-cum-fertilizer drill sowing, happy seeder, zero-till sowing, and potato planter services.',
                        'description_hi': 'सीड-कम-फर्टिलाइजर ड्रिल, जीरो टिलेज, हैप्पी सीडर और आलू प्लांटर बुवाई।',
                        'icon': 'Trees',
                        'is_active': True,
                        'base_unit': 'Per Acre',
                        'typical_price_range': '₹700 - ₹1,500 / एकड़',
                        'display_order': 4,
                    },
                    {
                        'slug': 'nursery_transplanting',
                        'name_en': 'Nursery & Transplanting',
                        'name_hi': 'पौधशाला एवं रोपाई',
                        'description_en': 'Paddy mat nursery management, manual and mechanical paddy transplanter operations.',
                        'description_hi': 'धान की नर्सरी प्रबंधन, हाथ व मशीन द्वारा धान रोपाई कार्य।',
                        'icon': 'Flower2',
                        'is_active': True,
                        'base_unit': 'Per Acre',
                        'typical_price_range': '₹2,000 - ₹3,500 / एकड़',
                        'display_order': 5,
                    },
                    {
                        'slug': 'irrigation',
                        'name_en': 'Irrigation Services',
                        'name_hi': 'सिंचाई प्रबंधन एवं ट्यूबवेल',
                        'description_en': 'Borewell submersible motor servicing, pipeline laying, drip and sprinkler micro-irrigation management.',
                        'description_hi': 'सबमर्सिबल मोटर सर्विस, पाइपलाइन लेइंग, ड्रिप एवं स्प्रिंकलर सिंचाई प्रबंधन।',
                        'icon': 'Droplet',
                        'is_active': True,
                        'base_unit': 'Per Visit / Hour',
                        'typical_price_range': '₹400 - ₹2,000 / सर्विस',
                        'display_order': 6,
                    },
                    {
                        'slug': 'labour',
                        'name_en': 'Agricultural Field Labour',
                        'name_hi': 'कृषि कुशल श्रमिक दल',
                        'description_en': 'Verified agricultural workers for weeding, hoeing, earthing up, spraying, and manual crop handling.',
                        'description_hi': 'निराई, गुड़ाई, मिट्टी चढ़ाना, छिड़काव और मैनुअल कृषि कार्यों के लिए कुशल श्रमिक।',
                        'icon': 'Users',
                        'is_active': True,
                        'base_unit': 'Per Person / Per Day',
                        'typical_price_range': '₹450 - ₹600 / दिन',
                        'display_order': 7,
                    },
                    {
                        'slug': 'crop_inspection',
                        'name_en': 'Expert Crop Inspection',
                        'name_hi': 'विशेषज्ञ फसल निरीक्षण',
                        'description_en': 'On-site agronomic health check, pest threshold scouting, disease diagnosis, and physiological review.',
                        'description_hi': 'खेत पर फसल स्वास्थ्य जांच, कीट निगरानी, रोग निदान एवं विशेषज्ञ परामर्श।',
                        'icon': 'ShieldCheck',
                        'is_active': True,
                        'base_unit': 'Per Field Visit',
                        'typical_price_range': '₹500 - ₹1,200 / विजिट',
                        'display_order': 8,
                    },
                    {
                        'slug': 'harvesting',
                        'name_en': 'Harvesting & Collection',
                        'name_hi': 'फसल कटाई एवं एकत्रीकरण',
                        'description_en': 'Combine harvesters, tractor-mounted reapers, sugarcane cutting labour, and potato digger operations.',
                        'description_hi': 'कंबाइन हार्वेस्टर, रीपर, गन्ना कटाई श्रमिक एवं आलू खुदाई मशीन सेवाएं।',
                        'icon': 'Wheat',
                        'is_active': True,
                        'base_unit': 'Per Acre',
                        'typical_price_range': '₹1,400 - ₹2,800 / एकड़',
                        'display_order': 9,
                    },
                    {
                        'slug': 'post_harvest',
                        'name_en': 'Post-Harvest Processing',
                        'name_hi': 'फसल मड़ाई एवं प्राथमिक प्रसंस्करण',
                        'description_en': 'Multi-crop thresher operations, grain winnowing, cleaning, sorting, and manual bagging.',
                        'description_hi': 'मल्टीक्रॉप थ्रेशर, ओसाई, सफाई, ग्रेडिंग और बोरी भराई कार्य।',
                        'icon': 'Boxes',
                        'is_active': True,
                        'base_unit': 'Per Quintal / Hour',
                        'typical_price_range': '₹80 - ₹180 / क्विंटल',
                        'display_order': 10,
                    },
                    {
                        'slug': 'transportation',
                        'name_en': 'Agricultural Transportation',
                        'name_hi': 'कृषि उत्पाद परिवहन',
                        'description_en': 'Hydraulic tractor trolley transport, pickup trucks for mandi delivery, sugar mill transport.',
                        'description_hi': 'हाइड्रोलिक ट्रॉली, मंडी ढुलाई, चीनी मिल गन्ना परिवहन एवं लोडिंग सेवाएं।',
                        'icon': 'Truck',
                        'is_active': True,
                        'base_unit': 'Per Trip / Quintal',
                        'typical_price_range': '₹600 - ₹2,500 / ट्रिप',
                        'display_order': 11,
                    },
                    {
                        'slug': 'storage',
                        'name_en': 'Storage Services',
                        'name_hi': 'भंडारण एवं कोल्ड स्टोरेज',
                        'description_en': 'Scientific grain warehouse reservation, potato cold storage space, moisture-controlled facilities.',
                        'description_hi': 'सुरक्षित अनाज गोदाम, आलू शीतगृह भंडारण एवं नमी नियंत्रित स्थान।',
                        'icon': 'Building2',
                        'is_active': True,
                        'base_unit': 'Per Bag / Season',
                        'typical_price_range': '₹120 - ₹260 / कट्टा / सीजन',
                        'display_order': 12,
                    },
                    {
                        'slug': 'market_assistance',
                        'name_en': 'Market & Sale Assistance',
                        'name_hi': 'मंडी एवं बिक्री समन्वय',
                        'description_en': 'APMC mandi price tracking, weighment coordination, packaging, and fair documentation support.',
                        'description_hi': 'मंडी भाव सूचना, तौल समन्वय, ग्रेडिंग और पारदर्शी बिक्री सहायता।',
                        'icon': 'TrendingUp',
                        'is_active': True,
                        'base_unit': 'Per Lot / Transaction',
                        'typical_price_range': '₹200 - ₹800 / लॉट',
                        'display_order': 13,
                    },
                    {
                        'slug': 'residue_management',
                        'name_en': 'Crop Residue Management',
                        'name_hi': 'फसल अवशेष प्रबंधन',
                        'description_en': 'Super Seeder, Straw Reaper, Baler, Mulcher, and in-situ paddy straw incorporation.',
                        'description_hi': 'सुपर सीडर, स्ट्रॉ रीपर, बेलर और पराली मल्चर द्वारा अवशेष प्रबंधन।',
                        'icon': 'Recycle',
                        'is_active': True,
                        'base_unit': 'Per Acre',
                        'typical_price_range': '₹1,000 - ₹2,000 / एकड़',
                        'display_order': 14,
                    },
                    {
                        'slug': 'equipment_repair',
                        'name_en': 'Equipment Repair',
                        'name_hi': 'कृषि उपकरण आपात मरम्मत',
                        'description_en': 'On-farm tractor mechanics, engine troubleshooting, clutch, gearbox, hydraulics, and tire repair.',
                        'description_hi': 'खेत पर आपातकालीन ट्रैक्टर मैकेनिक, इंजन, हाइड्रोलिक्स और टायर मरम्मत।',
                        'icon': 'Wrench',
                        'is_active': True,
                        'base_unit': 'Per Repair Job',
                        'typical_price_range': '₹300 - ₹1,500 / काम',
                        'display_order': 15,
                    },
                    {
                        'slug': 'equipment_maintenance',
                        'name_en': 'Equipment Maintenance',
                        'name_hi': 'आवधिक मशीनरी रखरखाव',
                        'description_en': 'Pre-season machinery overhaul, engine oil change, filter replacement, blade sharpening, greasing.',
                        'description_hi': 'सीजन पूर्व मशीनरी सर्विस, ऑयल चेंज, फिल्टर, ब्लेड धार एवं ग्रीसिंग।',
                        'icon': 'Cog',
                        'is_active': True,
                        'base_unit': 'Per Machine Service',
                        'typical_price_range': '₹500 - ₹2,200 / मशीन',
                        'display_order': 16,
                    },
                ]

                for cdata in categories_data:
                    slug = cdata['slug']
                    if not dry_run:
                        ServiceCategory.objects.update_or_create(slug=slug, defaults=cdata)
                    stats['categories']['accepted'] += 1

                # -----------------------------------------------------------------
                # 3. 27 Historical Machinery Rental Comparisons
                # -----------------------------------------------------------------
                machinery_benchmarks = [
                    # Tillage & Land Prep
                    ('Tractor 45-55 HP (Standard)', 'Primary Tillage', 'Uttar Pradesh', 'Meerut', 700.0, 950.0, 'Per Hour', '2023-24'),
                    ('Tractor 55+ HP (Heavy 4WD)', 'Deep Ploughing', 'Uttar Pradesh', 'Meerut', 900.0, 1300.0, 'Per Hour', '2023-24'),
                    ('MB Plough (Mouldboard)', 'Deep Inversion Ploughing', 'Uttar Pradesh', 'Meerut', 900.0, 1200.0, 'Per Acre', '2023-24'),
                    ('Rotavator (7 feet)', 'Secondary Tillage / Pulverization', 'Uttar Pradesh', 'Meerut', 800.0, 1100.0, 'Per Acre', '2023-24'),
                    ('Disc Harrow (16-18 discs)', 'Stubble Mulching & Clod Breaking', 'Uttar Pradesh', 'Meerut', 600.0, 850.0, 'Per Acre', '2023-24'),
                    ('Cultivator (9-11 tines)', 'Inter-row Weeding & Loosening', 'Uttar Pradesh', 'Meerut', 500.0, 750.0, 'Per Acre', '2023-24'),
                    ('Laser Land Leveler', 'Precision Field Leveling', 'Uttar Pradesh', 'Meerut', 800.0, 1200.0, 'Per Hour', '2023-24'),
                    ('Subsoiler / Chisel Plough', 'Hardpan Breaking', 'Uttar Pradesh', 'Meerut', 1000.0, 1400.0, 'Per Acre', '2023-24'),
                    
                    # Sowing & Planting
                    ('Seed-cum-Fertilizer Drill', 'Wheat / Mustard Sowing', 'Uttar Pradesh', 'Meerut', 700.0, 1000.0, 'Per Acre', '2023-24'),
                    ('Happy Seeder', 'Zero-till Wheat Sowing in Paddy Stubble', 'Uttar Pradesh', 'Meerut', 1200.0, 1600.0, 'Per Acre', '2023-24'),
                    ('Super Seeder', 'Combined Mulching & Wheat Sowing', 'Uttar Pradesh', 'Meerut', 1800.0, 2400.0, 'Per Acre', '2023-24'),
                    ('Zero Till Drill', 'Direct Sowing without Tillage', 'Uttar Pradesh', 'Meerut', 800.0, 1100.0, 'Per Acre', '2023-24'),
                    ('Paddy Transplanter (4-Row Ride-on)', 'Mechanical Paddy Transplanting', 'Uttar Pradesh', 'Meerut', 2200.0, 3000.0, 'Per Acre', '2023-24'),
                    ('Potato Planter (Automatic 2-Row)', 'Precision Potato Tuber Sowing', 'Uttar Pradesh', 'Meerut', 1800.0, 2500.0, 'Per Acre', '2023-24'),
                    ('Sugarcane Cutter Planter', 'Sett Cutting & Furrow Sowing', 'Uttar Pradesh', 'Meerut', 2000.0, 2800.0, 'Per Acre', '2023-24'),
                    ('Raised Bed Planter', 'Bed Sowing for Maize & Potato', 'Uttar Pradesh', 'Meerut', 900.0, 1300.0, 'Per Acre', '2023-24'),

                    # Harvesting & Threshing
                    ('Combine Harvester (Self-Propelled)', 'Wheat Harvesting & Separation', 'Uttar Pradesh', 'Meerut', 1500.0, 2200.0, 'Per Acre', '2023-24'),
                    ('Combine Harvester with Straw SMS', 'Paddy Harvesting with Residue Spread', 'Uttar Pradesh', 'Meerut', 2000.0, 2800.0, 'Per Acre', '2023-24'),
                    ('Tractor-Mounted Reaper', 'Wheat / Paddy Crop Cutting', 'Uttar Pradesh', 'Meerut', 800.0, 1200.0, 'Per Acre', '2023-24'),
                    ('Multi-Crop Thresher (Engine-Driven)', 'Stationary Grain Threshing', 'Uttar Pradesh', 'Meerut', 700.0, 1000.0, 'Per Hour', '2023-24'),
                    ('Potato Digger Elevator', 'Tuber Digging & Soil Separation', 'Uttar Pradesh', 'Meerut', 1400.0, 2000.0, 'Per Acre', '2023-24'),
                    ('Sugarcane Harvester / Loader', 'Stalk Cutting & Trailer Loading', 'Uttar Pradesh', 'Meerut', 2500.0, 3600.0, 'Per Acre', '2023-24'),

                    # Crop Residue & Post-Harvest
                    ('Straw Reaper & Binder', 'Wheat Bhusa Making & Bagging', 'Uttar Pradesh', 'Meerut', 1200.0, 1700.0, 'Per Acre', '2023-24'),
                    ('Round Straw Baler', 'Paddy Straw Baling (20-25 kg)', 'Uttar Pradesh', 'Meerut', 1000.0, 1500.0, 'Per Acre', '2023-24'),
                    ('Paddy Mulcher / Chopper', 'In-situ Straw Chopping', 'Uttar Pradesh', 'Meerut', 1100.0, 1500.0, 'Per Acre', '2023-24'),
                    ('Hydraulic Tipping Trolley', 'Mandi & Sugar Mill Transport', 'Uttar Pradesh', 'Meerut', 700.0, 1200.0, 'Per Trip', '2023-24'),
                    ('Boom Sprayer (Tractor-Mounted)', 'Uniform Foliar Spraying', 'Uttar Pradesh', 'Meerut', 400.0, 650.0, 'Per Acre', '2023-24'),
                ]

                for eq_type, op, state, dist, r_min, r_max, unit, yr in machinery_benchmarks:
                    if not dry_run:
                        HistoricalMachineryRate.objects.update_or_create(
                            equipment_type=eq_type,
                            operation=op,
                            state=state,
                            district=dist,
                            reference_year=yr,
                            defaults={
                                'historical_rate_min': Decimal(str(r_min)),
                                'historical_rate_max': Decimal(str(r_max)),
                                'rate_unit': unit,
                                'source_reference': 'World Bank Mechanization Assessment / SMAM Directory',
                                'is_indicative_only': True
                            }
                        )
                    stats['machinery_rates']['accepted'] += 1

                # -----------------------------------------------------------------
                # 4. 11 Years of Agricultural Wage Observations (2014-15 to 2024-25)
                # -----------------------------------------------------------------
                wage_observations = [
                    ('2014-15', 'General Field Labour', 230.0),
                    ('2014-15', 'Harvesting & Threshing', 250.0),
                    ('2015-16', 'General Field Labour', 245.0),
                    ('2015-16', 'Harvesting & Threshing', 265.0),
                    ('2016-17', 'General Field Labour', 260.0),
                    ('2016-17', 'Harvesting & Threshing', 285.0),
                    ('2017-18', 'General Field Labour', 280.0),
                    ('2017-18', 'Harvesting & Threshing', 310.0),
                    ('2018-19', 'General Field Labour', 305.0),
                    ('2018-19', 'Harvesting & Threshing', 340.0),
                    ('2019-20', 'General Field Labour', 330.0),
                    ('2019-20', 'Harvesting & Threshing', 370.0),
                    ('2020-21', 'General Field Labour', 360.0),
                    ('2020-21', 'Harvesting & Threshing', 400.0),
                    ('2021-22', 'General Field Labour', 390.0),
                    ('2021-22', 'Harvesting & Threshing', 435.0),
                    ('2022-23', 'General Field Labour', 425.0),
                    ('2022-23', 'Harvesting & Threshing', 480.0),
                    ('2023-24', 'General Field Labour', 460.0),
                    ('2023-24', 'Harvesting & Threshing', 520.0),
                    ('2024-25', 'General Field Labour', 500.0),
                    ('2024-25', 'Harvesting & Threshing', 560.0),
                ]

                for yr, op, rate in wage_observations:
                    if not dry_run:
                        HistoricalAgriculturalWage.objects.update_or_create(
                            state='Uttar Pradesh',
                            district='Meerut',
                            operation=op,
                            reference_year=yr,
                            defaults={
                                'daily_wage_rate': Decimal(str(rate)),
                                'gender_category': 'All',
                                'source_reference': 'RBI Rural Wages Bulletin / Labour Bureau Survey',
                                'is_indicative_only': True
                            }
                        )
                    stats['wage_observations']['accepted'] += 1

                # -----------------------------------------------------------------
                # 5. Canonical Agricultural Reference Records from Research CSV
                # -----------------------------------------------------------------
                csv_path = research_dir / 'phase02' / 'Parameter_records.csv'
                if csv_path.exists():
                    with open(csv_path, 'r', encoding='utf-8', errors='ignore') as f:
                        reader = csv.DictReader(f)
                        for idx, row in enumerate(reader):
                            jurisdiction = row.get('Jurisdiction', '').strip()
                            parameter = row.get('Parameter', '').strip()
                            raw_val = row.get('Value', '').strip()
                            unit = row.get('Unit', '').strip()
                            ref_yr = row.get('Reference year', '').strip()
                            source = row.get('Source', '').strip()
                            table = row.get('Table', '').strip()
                            status_text = row.get('Status', '').strip()

                            if not jurisdiction or not parameter:
                                stats['reference_records']['skipped'] += 1
                                continue

                            # Unique canonical record ID
                            clean_state = jurisdiction.lower().replace(' ', '_').replace('&', 'and')
                            clean_param = parameter.lower().replace(' ', '_').replace('/', '_')
                            rec_id = f"AGR-REF-{clean_state}-{clean_param}"

                            # Parse numeric value if available
                            num_val = None
                            if raw_val:
                                try:
                                    num_val = Decimal(raw_val.replace(',', ''))
                                except Exception:
                                    num_val = None

                            # Evidence classification
                            if 'Prior extract' in status_text or 'provisional' in ref_yr:
                                evidence_class = 'ESTIMATED'
                            elif 'Not acquired' in status_text:
                                evidence_class = 'UNAVAILABLE'
                            else:
                                evidence_class = 'PARTIALLY_VERIFIED'

                            if not dry_run:
                                AgriculturalReferenceRecord.objects.update_or_create(
                                    record_id=rec_id,
                                    defaults={
                                        'dataset': 'DES Land Use & Agriculture Statistics',
                                        'indicator': parameter,
                                        'original_value': raw_val or 'Not acquired',
                                        'numeric_value': num_val,
                                        'unit': unit,
                                        'state': jurisdiction,
                                        'district': '',
                                        'crop': '',
                                        'reference_period': ref_yr,
                                        'publication_date': '2024-25',
                                        'source_publisher': 'Directorate of Economics and Statistics, MoA&FW',
                                        'source_url': source,
                                        'table_page_ref': table,
                                        'evidence_classification': evidence_class,
                                        'verification_status': status_text,
                                        'licensing_status': 'Government Open Data / Public Domain Reference',
                                        'notes': f"Transcribed record from {table}"
                                    }
                                )
                            stats['reference_records']['accepted'] += 1

                if dry_run:
                    self.stdout.write(self.style.WARNING("DRY-RUN completed. Rolling back transaction."))
                    raise transaction.TransactionManagementError("Dry-run requested rollback.")

        except transaction.TransactionManagementError:
            pass

        # Write import log
        log_dir = research_dir / 'import_logs'
        log_dir.mkdir(parents=True, exist_ok=True)
        log_file = log_dir / 'import_manifest.json'
        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump(stats, f, indent=2)

        self.stdout.write(self.style.SUCCESS(
            f"\n[Import Summary Report]\n"
            f"  - Service Categories: {stats['categories']['accepted']} accepted\n"
            f"  - Historical Machinery Comparisons: {stats['machinery_rates']['accepted']} accepted\n"
            f"  - 11-Year Wage Observations: {stats['wage_observations']['accepted']} accepted\n"
            f"  - Agricultural Reference Records: {stats['reference_records']['accepted']} accepted\n"
            f"  - Input Files Fingerprinted: {len(stats['input_manifest'])}\n"
            f"  - Import Manifest Saved to: {log_file}\n"
        ))
