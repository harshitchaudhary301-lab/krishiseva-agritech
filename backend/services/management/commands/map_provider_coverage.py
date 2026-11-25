"""
Management command to map existing provider records to official LGD coverage areas,
exclusive and shared resources, availability windows, and structured pricing models.
Preserves unmatched records in QuarantineLocationRecord for audit.
"""
from decimal import Decimal
from datetime import date
from django.core.management.base import BaseCommand
from accounts.models import User, ProviderProfile, WorkerProfile
from services.models import (
    Village, SubDistrict, District, State, ServiceCategory,
    ProviderService, ProviderCoverageArea, ProviderResource,
    ProviderAvailabilityWindow, QuarantineLocationRecord
)


class Command(BaseCommand):
    help = 'Map existing provider records to official LGD coverage areas, resources, and availability'

    def handle(self, *args, **options):
        self.stdout.write("Mapping existing provider coverage, resources, and pricing...")

        up_state = State.objects.filter(name_en__iexact='Uttar Pradesh').first()
        meerut_district = District.objects.filter(name_en__iexact='Meerut').first()
        sardhana_sd = SubDistrict.objects.filter(district=meerut_district, name_en__iexact='Sardhana').first()
        mawana_sd = SubDistrict.objects.filter(district=meerut_district, name_en__iexact='Mawana').first()
        meerut_sd = SubDistrict.objects.filter(district=meerut_district, name_en__iexact='Meerut').first()

        v_daurala = Village.objects.filter(district__iexact='Meerut', name__iexact='Daurala').first()
        v_sardhana = Village.objects.filter(district__iexact='Meerut', name__iexact='Sardhana').first()
        v_mawana = Village.objects.filter(district__iexact='Meerut', name__iexact='Mawana').first()
        v_hastinapur = Village.objects.filter(district__iexact='Meerut', name__iexact='Hastinapur').first()
        v_jani = Village.objects.filter(district__iexact='Meerut', name__iexact='Jani').first()

        # Categories
        cat_mechanic = ServiceCategory.objects.filter(slug='tractor_mechanic').first()
        cat_tubewell = ServiceCategory.objects.filter(slug='tubewell_repair').first()
        cat_machinery = ServiceCategory.objects.filter(slug='machinery_rental').first()
        cat_labour = ServiceCategory.objects.filter(slug='labour').first()
        cat_harvesting = ServiceCategory.objects.filter(slug='harvesting').first()
        cat_land_prep = ServiceCategory.objects.filter(slug='land_preparation').first()
        cat_sowing = ServiceCategory.objects.filter(slug='sowing_planting').first()

        # 1. vikram_mechanic
        u_vikram = User.objects.filter(username='vikram_mechanic').first()
        if u_vikram:
            s_vikram, _ = ProviderService.objects.get_or_create(
                provider=u_vikram,
                category=cat_mechanic,
                defaults={
                    'title': 'On-Farm Tractor Repair & Diagnostic Service',
                    'description': 'Mobile hydraulic & diesel engine repair at farm doorstep.',
                    'base_rate': Decimal('800.00'),
                    'price_amount': Decimal('800.00'),
                    'pricing_method': 'fixed',
                    'rate_unit': 'per visit',
                    'equipment_models': 'Mahindra, Swaraj, Sonalika, Eicher',
                    'is_active': True,
                }
            )
            s_vikram.pricing_method = 'fixed'
            s_vikram.price_amount = Decimal('800.00')
            s_vikram.base_rate = Decimal('800.00')
            s_vikram.rate_unit = 'per visit'
            s_vikram.save()

            # Coverage areas
            for v in [v_daurala, v_sardhana, v_mawana]:
                if v:
                    ProviderCoverageArea.objects.get_or_create(
                        provider=u_vikram,
                        coverage_level='village',
                        village=v,
                        district=meerut_district,
                        state=up_state,
                        defaults={'includes_subordinates': True, 'is_active': True}
                    )
            # Meerut Rural standalone coverage without whole district subordinate guarantee
            ProviderCoverageArea.objects.get_or_create(
                provider=u_vikram,
                coverage_level='district',
                district=meerut_district,
                state=up_state,
                defaults={'includes_subordinates': False, 'is_active': True}
            )

            # Resource
            res_vikram, _ = ProviderResource.objects.get_or_create(
                provider=u_vikram,
                identifier='VIKRAM-DIAG-01',
                defaults={
                    'name': 'Kisan Mobile Workshop & Hydraulic Rig',
                    'category': cat_mechanic,
                    'resource_type': 'exclusive',
                    'capacity': Decimal('1.00'),
                    'capacity_unit': 'machine',
                    'is_active': True,
                }
            )

            # Availability Window
            ProviderAvailabilityWindow.objects.get_or_create(
                provider=u_vikram,
                resource=res_vikram,
                start_date=date(2026, 11, 1),
                end_date=date(2027, 4, 30),
                defaults={'is_available': True, 'notes': 'Regular operational season'}
            )
            self.stdout.write("Configured vikram_mechanic")

        # 2. amit_tubewell
        u_amit = User.objects.filter(username='amit_tubewell').first()
        if u_amit:
            s_amit, _ = ProviderService.objects.get_or_create(
                provider=u_amit,
                category=cat_tubewell,
                defaults={
                    'title': 'Submersible Pump & Starter Rewind Service',
                    'description': 'Tubewell motor pulling, bearing replacement, and starter repair.',
                    'base_rate': Decimal('1200.00'),
                    'price_amount': Decimal('1200.00'),
                    'pricing_method': 'fixed',
                    'rate_unit': 'per repair',
                    'is_active': True,
                }
            )
            s_amit.pricing_method = 'fixed'
            s_amit.price_amount = Decimal('1200.00')
            s_amit.base_rate = Decimal('1200.00')
            s_amit.rate_unit = 'per repair'
            s_amit.save()

            for v in [v_daurala, v_jani, v_sardhana]:
                if v:
                    ProviderCoverageArea.objects.get_or_create(
                        provider=u_amit,
                        coverage_level='village',
                        village=v,
                        district=meerut_district,
                        state=up_state,
                        defaults={'includes_subordinates': True, 'is_active': True}
                    )

            res_amit, _ = ProviderResource.objects.get_or_create(
                provider=u_amit,
                identifier='AMIT-RIG-01',
                defaults={
                    'name': 'Verma Submersible Extraction Crane & Test Rig',
                    'category': cat_tubewell,
                    'resource_type': 'exclusive',
                    'capacity': Decimal('1.00'),
                    'capacity_unit': 'machine',
                    'is_active': True,
                }
            )

            ProviderAvailabilityWindow.objects.get_or_create(
                provider=u_amit,
                resource=res_amit,
                start_date=date(2026, 11, 1),
                end_date=date(2027, 4, 30),
                defaults={'is_available': True, 'notes': 'Daily irrigation maintenance window'}
            )
            self.stdout.write("Configured amit_tubewell")

        # 3. baldev_machinery
        u_baldev = User.objects.filter(username='baldev_machinery').first()
        if u_baldev:
            s_baldev, _ = ProviderService.objects.get_or_create(
                provider=u_baldev,
                category=cat_machinery,
                defaults={
                    'title': 'Modern Combine Harvester (With Grain Tank & Straw Chopper)',
                    'description': 'Clean harvesting for wheat and paddy with minimal grain loss.',
                    'base_rate': Decimal('1600.00'),
                    'price_amount': Decimal('1600.00'),
                    'pricing_method': 'per_acre',
                    'rate_unit': 'per acre',
                    'equipment_models': 'Preet 987, John Deere 5050D',
                    'is_active': True,
                }
            )
            s_baldev.pricing_method = 'per_acre'
            s_baldev.price_amount = Decimal('1600.00')
            s_baldev.base_rate = Decimal('1600.00')
            s_baldev.rate_unit = 'per acre'
            s_baldev.save()

            for v in [v_mawana, v_daurala, v_hastinapur, v_sardhana]:
                if v:
                    ProviderCoverageArea.objects.get_or_create(
                        provider=u_baldev,
                        coverage_level='village',
                        village=v,
                        district=meerut_district,
                        state=up_state,
                        defaults={'includes_subordinates': True, 'is_active': True}
                    )
            if mawana_sd:
                ProviderCoverageArea.objects.get_or_create(
                    provider=u_baldev,
                    coverage_level='subdistrict',
                    subdistrict=mawana_sd,
                    district=meerut_district,
                    state=up_state,
                    defaults={'includes_subordinates': True, 'is_active': True}
                )

            res_baldev, _ = ProviderResource.objects.get_or_create(
                provider=u_baldev,
                identifier='BALDEV-COMBINE-02',
                defaults={
                    'name': 'Modern Combine Harvester Fleet',
                    'category': cat_machinery,
                    'resource_type': 'exclusive',
                    'capacity': Decimal('1.00'),
                    'capacity_unit': 'machine',
                    'is_active': True,
                }
            )

            ProviderAvailabilityWindow.objects.get_or_create(
                provider=u_baldev,
                resource=res_baldev,
                start_date=date(2026, 11, 1),
                end_date=date(2027, 4, 30),
                defaults={'is_available': True, 'notes': 'Harvesting & land preparation window'}
            )
            self.stdout.write("Configured baldev_machinery")

        # 4. rajesh_mechanic
        u_rajesh = User.objects.filter(username='rajesh_mechanic').first()
        if u_rajesh:
            s_rajesh, _ = ProviderService.objects.get_or_create(
                provider=u_rajesh,
                category=cat_mechanic,
                defaults={
                    'title': 'Emergency Tractor Repair & Tune Up',
                    'description': 'Clutch, brake, radiator and hydraulic repairs in field.',
                    'base_rate': Decimal('750.00'),
                    'price_amount': Decimal('750.00'),
                    'pricing_method': 'fixed',
                    'rate_unit': 'per visit',
                    'is_active': True,
                }
            )
            s_rajesh.pricing_method = 'fixed'
            s_rajesh.price_amount = Decimal('750.00')
            s_rajesh.base_rate = Decimal('750.00')
            s_rajesh.rate_unit = 'per visit'
            s_rajesh.save()

            for v in [v_sardhana, v_daurala, v_jani]:
                if v:
                    ProviderCoverageArea.objects.get_or_create(
                        provider=u_rajesh,
                        coverage_level='village',
                        village=v,
                        district=meerut_district,
                        state=up_state,
                        defaults={'includes_subordinates': True, 'is_active': True}
                    )

            res_rajesh, _ = ProviderResource.objects.get_or_create(
                provider=u_rajesh,
                identifier='RAJESH-VAN-01',
                defaults={
                    'name': 'Om Shanti On-Field Service Van',
                    'category': cat_mechanic,
                    'resource_type': 'exclusive',
                    'capacity': Decimal('1.00'),
                    'capacity_unit': 'machine',
                    'is_active': True,
                }
            )

            ProviderAvailabilityWindow.objects.get_or_create(
                provider=u_rajesh,
                resource=res_rajesh,
                start_date=date(2026, 11, 1),
                end_date=date(2027, 4, 30),
                defaults={'is_available': True, 'notes': 'On-demand mechanical support'}
            )
            self.stdout.write("Configured rajesh_mechanic")

        # 5. provider_e2e
        u_e2e = User.objects.filter(username='provider_e2e').first()
        if u_e2e:
            if cat_land_prep:
                s_e2e_land, _ = ProviderService.objects.get_or_create(
                    provider=u_e2e,
                    category=cat_land_prep,
                    defaults={
                        'title': 'Laser Land Leveling & Rotavator Preparation',
                        'description': 'Precision grading and deep seedbed tilling.',
                        'base_rate': Decimal('1400.00'),
                        'price_amount': Decimal('1400.00'),
                        'pricing_method': 'per_acre',
                        'rate_unit': 'per acre',
                        'is_active': True,
                    }
                )
                s_e2e_land.pricing_method = 'per_acre'
                s_e2e_land.price_amount = Decimal('1400.00')
                s_e2e_land.save()

            if cat_harvesting:
                s_e2e_harv, _ = ProviderService.objects.get_or_create(
                    provider=u_e2e,
                    category=cat_harvesting,
                    defaults={
                        'title': 'Multi-Crop Mechanical Harvesting',
                        'description': 'Harvester service for wheat, paddy and mustard.',
                        'base_rate': Decimal('1800.00'),
                        'price_amount': Decimal('1800.00'),
                        'pricing_method': 'per_acre',
                        'rate_unit': 'per acre',
                        'is_active': True,
                    }
                )
                s_e2e_harv.pricing_method = 'per_acre'
                s_e2e_harv.price_amount = Decimal('1800.00')
                s_e2e_harv.save()

            if v_hastinapur:
                ProviderCoverageArea.objects.get_or_create(
                    provider=u_e2e,
                    coverage_level='village',
                    village=v_hastinapur,
                    district=meerut_district,
                    state=up_state,
                    defaults={'includes_subordinates': True, 'is_active': True}
                )
            if meerut_district:
                ProviderCoverageArea.objects.get_or_create(
                    provider=u_e2e,
                    coverage_level='district',
                    district=meerut_district,
                    state=up_state,
                    defaults={'includes_subordinates': True, 'is_active': True}
                )

            res_e2e_exc, _ = ProviderResource.objects.get_or_create(
                provider=u_e2e,
                identifier='E2E-LASER-01',
                defaults={
                    'name': 'Verma Laser Leveler & High-Power Tractor',
                    'category': cat_land_prep,
                    'resource_type': 'exclusive',
                    'capacity': Decimal('1.00'),
                    'capacity_unit': 'machine',
                    'is_active': True,
                }
            )

            res_e2e_shared, _ = ProviderResource.objects.get_or_create(
                provider=u_e2e,
                identifier='E2E-CREW-10',
                defaults={
                    'name': 'Custom Land Preparation Fleet Capacity',
                    'category': cat_land_prep,
                    'resource_type': 'shared',
                    'capacity': Decimal('20.00'),
                    'capacity_unit': 'acre/day',
                    'is_active': True,
                }
            )

            ProviderAvailabilityWindow.objects.get_or_create(
                provider=u_e2e,
                resource=res_e2e_exc,
                start_date=date(2026, 11, 1),
                end_date=date(2027, 4, 30),
                defaults={'is_available': True, 'notes': 'E2E seasonal window'}
            )
            self.stdout.write("Configured provider_e2e")

        # 6. suresh_worker
        u_suresh = User.objects.filter(username='suresh_worker').first()
        if u_suresh:
            if cat_labour:
                s_suresh, _ = ProviderService.objects.get_or_create(
                    provider=u_suresh,
                    category=cat_labour,
                    defaults={
                        'title': 'Skilled Harvesting & Farm Field Labour',
                        'description': 'Experienced team for reaping, threshing, loading.',
                        'base_rate': Decimal('500.00'),
                        'price_amount': Decimal('500.00'),
                        'pricing_method': 'per_day',
                        'rate_unit': 'per day',
                        'is_active': True,
                    }
                )
                s_suresh.pricing_method = 'per_day'
                s_suresh.price_amount = Decimal('500.00')
                s_suresh.save()

            if v_daurala:
                ProviderCoverageArea.objects.get_or_create(
                    provider=u_suresh,
                    coverage_level='village',
                    village=v_daurala,
                    district=meerut_district,
                    state=up_state,
                    defaults={'includes_subordinates': True, 'is_active': True}
                )
            if sardhana_sd:
                ProviderCoverageArea.objects.get_or_create(
                    provider=u_suresh,
                    coverage_level='subdistrict',
                    subdistrict=sardhana_sd,
                    district=meerut_district,
                    state=up_state,
                    defaults={'includes_subordinates': True, 'is_active': True}
                )

            res_suresh, _ = ProviderResource.objects.get_or_create(
                provider=u_suresh,
                identifier='SURESH-CREW-08',
                defaults={
                    'name': 'Suresh Field Labour Crew',
                    'category': cat_labour,
                    'resource_type': 'shared',
                    'capacity': Decimal('8.00'),
                    'capacity_unit': 'labourer',
                    'is_active': True,
                }
            )

            ProviderAvailabilityWindow.objects.get_or_create(
                provider=u_suresh,
                resource=res_suresh,
                start_date=date(2026, 11, 1),
                end_date=date(2027, 4, 30),
                defaults={'is_available': True, 'notes': 'Daily harvest labour'}
            )
            self.stdout.write("Configured suresh_worker")

        # 7. dinesh_worker
        u_dinesh = User.objects.filter(username='dinesh_worker').first()
        if u_dinesh:
            if cat_labour:
                s_dinesh, _ = ProviderService.objects.get_or_create(
                    provider=u_dinesh,
                    category=cat_labour,
                    defaults={
                        'title': 'Sowing, Transplanting & Spraying Labour',
                        'description': 'Paddy transplanting, weeding and fertilizer application crew.',
                        'base_rate': Decimal('480.00'),
                        'price_amount': Decimal('480.00'),
                        'pricing_method': 'per_day',
                        'rate_unit': 'per day',
                        'is_active': True,
                    }
                )
                s_dinesh.pricing_method = 'per_day'
                s_dinesh.price_amount = Decimal('480.00')
                s_dinesh.save()

            if v_sardhana:
                ProviderCoverageArea.objects.get_or_create(
                    provider=u_dinesh,
                    coverage_level='village',
                    village=v_sardhana,
                    district=meerut_district,
                    state=up_state,
                    defaults={'includes_subordinates': True, 'is_active': True}
                )
            if sardhana_sd:
                ProviderCoverageArea.objects.get_or_create(
                    provider=u_dinesh,
                    coverage_level='subdistrict',
                    subdistrict=sardhana_sd,
                    district=meerut_district,
                    state=up_state,
                    defaults={'includes_subordinates': True, 'is_active': True}
                )

            res_dinesh, _ = ProviderResource.objects.get_or_create(
                provider=u_dinesh,
                identifier='DINESH-CREW-06',
                defaults={
                    'name': 'Dinesh Sowing & Weeding Crew',
                    'category': cat_labour,
                    'resource_type': 'shared',
                    'capacity': Decimal('6.00'),
                    'capacity_unit': 'labourer',
                    'is_active': True,
                }
            )

            ProviderAvailabilityWindow.objects.get_or_create(
                provider=u_dinesh,
                resource=res_dinesh,
                start_date=date(2026, 11, 1),
                end_date=date(2027, 4, 30),
                defaults={'is_available': True, 'notes': 'Daily field labour'}
            )
            self.stdout.write("Configured dinesh_worker")

        # Unmatched check / quarantine preservation
        # Check provider text fields for unmatched village names
        for p in ProviderProfile.objects.all():
            villages = [v.strip() for v in (p.service_villages or '').split(',') if v.strip()]
            for v_name in villages:
                match = Village.objects.filter(district__iexact='Meerut', name__iexact=v_name).first()
                if not match and v_name.lower() not in ['meerut rural', 'daurala', 'sardhana', 'mawana', 'hastinapur', 'jani']:
                    QuarantineLocationRecord.objects.get_or_create(
                        source_file='provider_profile_service_villages',
                        raw_data={'provider_id': p.user_id, 'unmatched_name': v_name},
                        defaults={'reason': f"Unmatched village string '{v_name}' in provider profile {p.user.username}"}
                    )

        self.stdout.write(self.style.SUCCESS("Successfully mapped provider coverage areas, resources, and availability."))
