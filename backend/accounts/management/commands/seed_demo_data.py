import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from accounts.models import FarmerProfile, WorkerProfile, ProviderProfile
from services.models import Village, ServiceCategory, ProviderService, Review
from farm_projects.models import Farm, FarmProject, ProjectService
from bookings.models import ServiceRequest, Quotation, Booking, BookingEvent, Notification

User = get_user_model()

class Command(BaseCommand):
    help = "Seed fictional demo data for KrishiSeva platform validation and demonstration."

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-admin',
            action='store_true',
            help='Skip creating the default admin superuser (recommended for production).'
        )
        parser.add_argument(
            '--include-admin',
            action='store_true',
            help='Explicitly allow creating the default admin superuser even in production mode.'
        )

    def handle(self, *args, **options):
        from django.conf import settings
        skip_admin = options.get('skip_admin', False)
        include_admin = options.get('include_admin', False)

        if not settings.DEBUG and not include_admin:
            skip_admin = True
            self.stdout.write(self.style.WARNING(
                "Production environment detected: Skipping default admin superuser creation for security.\n"
                "Please run 'python manage.py createsuperuser' to set a secure administrator password."
            ))

        self.stdout.write(self.style.NOTICE("Clearing old demo data..."))
        # Clean existing data for clean re-run
        BookingEvent.objects.all().delete()
        Booking.objects.all().delete()
        Quotation.objects.all().delete()
        ProjectService.objects.all().delete()
        ServiceRequest.objects.all().delete()
        FarmProject.objects.all().delete()
        Farm.objects.all().delete()
        ProviderService.objects.all().delete()
        Review.objects.all().delete()
        Notification.objects.all().delete()
        
        # Keep superuser if exists or recreate
        User.objects.filter(is_superuser=False).delete()

        self.stdout.write(self.style.SUCCESS("Seeding service categories..."))
        categories_data = [
            {
                'slug': 'labour',
                'name_en': 'Agricultural Labour',
                'name_hi': 'कृषि श्रमिक',
                'description_en': 'Verified skilled farm workers for harvesting, sowing, weeding, and crop handling.',
                'description_hi': 'कटाई, बुवाई, निराई और फसल प्रबंधन के लिए कुशल ग्रामीण श्रमिक।',
                'icon': 'Users',
                'is_active': True,
                'base_unit': 'Per Person / Per Day',
                'typical_price_range': '₹450 - ₹600 / दिन',
                'display_order': 1,
            },
            {
                'slug': 'tractor_mechanic',
                'name_en': 'Tractor Mechanic',
                'name_hi': 'ट्रैक्टर मैकेनिक',
                'description_en': 'On-farm emergency repair, engine overhaul, hydraulic service, and electrical tune-up.',
                'description_hi': 'खेत पर आपातकालीन मरम्मत, इंजन ओवरहाल, हाइड्रोलिक्स और सर्विस।',
                'icon': 'Wrench',
                'is_active': True,
                'base_unit': 'Per Visit / Inspection',
                'typical_price_range': '₹300 - ₹1,500 / सर्विस',
                'display_order': 2,
            },
            {
                'slug': 'tubewell_repair',
                'name_en': 'Tubewell Repair',
                'name_hi': 'ट्यूबवेल व मोटर मरम्मत',
                'description_en': 'Borewell submersible motor winding, pump servicing, starter repair, and pipe lifting.',
                'description_hi': 'सबमर्सिबल मोटर वाइंडिंग, पंप रिपेयर, स्टार्टर एवं पाइप लिफ्टिंग।',
                'icon': 'Droplet',
                'is_active': True,
                'base_unit': 'Per Motor / Service',
                'typical_price_range': '₹500 - ₹2,500 / सर्विस',
                'display_order': 3,
            },
            {
                'slug': 'machinery_rental',
                'name_en': 'Machinery Rental',
                'name_hi': 'कृषि यंत्र किराया',
                'description_en': 'Combine harvesters, laser levelers, rotavators, happy seeders, and heavy tractors.',
                'description_hi': 'कंबाइन हार्वेस्टर, लेजर लैंड लेवलर, रोटावेटर और भारी ट्रैक्टर किराया।',
                'icon': 'Tractor',
                'is_active': True,
                'base_unit': 'Per Acre / Per Hour',
                'typical_price_range': '₹800 - ₹2,200 / एकड़',
                'display_order': 4,
            },
            {
                'slug': 'irrigation',
                'name_en': 'Irrigation & Drip',
                'name_hi': 'सिंचाई एवं ड्रिप सिस्टम',
                'description_en': 'Drip lines, sprinkler setup, pipeline laying, and micro-irrigation installation.',
                'description_hi': 'ड्रिप लाइन, स्प्रिंकलर और पाइपलाइन इंस्टॉलेशन।',
                'icon': 'Waves',
                'is_active': False,
                'base_unit': 'Per Acre',
                'typical_price_range': 'Upcoming',
                'display_order': 5,
            },
            {
                'slug': 'suppliers',
                'name_en': 'Agricultural Suppliers',
                'name_hi': 'बीज एवं खाद आपूर्तिकर्ता',
                'description_en': 'Certified high-yield seeds, licensed bio-fertilizers, and organic soil amendments.',
                'description_hi': 'प्रमाणित बीज, जैविक उर्वरक एवं पोषण सप्लायर्स।',
                'icon': 'Sprout',
                'is_active': False,
                'base_unit': 'Per Bag / Unit',
                'typical_price_range': 'Upcoming',
                'display_order': 6,
            },
            {
                'slug': 'transportation',
                'name_en': 'Agricultural Transport',
                'name_hi': 'फसल परिवहन एवं ढुलाई',
                'description_en': 'Trolleys, mini-trucks, and transport to mandis, godowns, and sugar mills.',
                'description_hi': 'मंडी और मिलों तक अनाज ढुलाई के लिए ट्रॉली और वाहन।',
                'icon': 'Truck',
                'is_active': False,
                'base_unit': 'Per Quintal / Km',
                'typical_price_range': 'Upcoming',
                'display_order': 7,
            },
            {
                'slug': 'storage',
                'name_en': 'Warehouses & Cold Storage',
                'name_hi': 'अनाज भंडारण एवं कोल्ड स्टोरेज',
                'description_en': 'Scientific grain godowns, potato cold stores, and moisture-controlled facilities.',
                'description_hi': 'सुरक्षित अनाज गोदाम और शीतगृह भंडारण।',
                'icon': 'Building2',
                'is_active': False,
                'base_unit': 'Per Bag / Month',
                'typical_price_range': 'Upcoming',
                'display_order': 8,
            },
        ]

        cat_map = {}
        for c in categories_data:
            cat, _ = ServiceCategory.objects.update_or_create(slug=c['slug'], defaults=c)
            cat_map[c['slug']] = cat

        self.stdout.write(self.style.SUCCESS("Seeding villages..."))
        villages_data = [
            {'name': 'Daurala', 'district': 'Meerut', 'state': 'Uttar Pradesh', 'pincode': '250221'},
            {'name': 'Sardhana', 'district': 'Meerut', 'state': 'Uttar Pradesh', 'pincode': '250342'},
            {'name': 'Mawana', 'district': 'Meerut', 'state': 'Uttar Pradesh', 'pincode': '250401'},
            {'name': 'Hastinapur', 'district': 'Meerut', 'state': 'Uttar Pradesh', 'pincode': '250404'},
            {'name': 'Jani', 'district': 'Meerut', 'state': 'Uttar Pradesh', 'pincode': '250501'},
            {'name': 'Partapur', 'district': 'Meerut', 'state': 'Uttar Pradesh', 'pincode': '250103'},
        ]
        for v in villages_data:
            Village.objects.update_or_create(name=v['name'], district=v['district'], state=v['state'], defaults=v)

        self.stdout.write(self.style.SUCCESS("Seeding demo users..."))

        # Admin user (skipped if --skip-admin or in production without --include-admin)
        if not skip_admin:
            admin_user, created = User.objects.get_or_create(username='admin', defaults={
                'email': 'admin@krishiseva.in',
                'first_name': 'Harshit',
                'last_name': 'Chaudhary',
                'role': 'admin',
                'phone': '+91 98000 00001',
                'state': 'Uttar Pradesh',
                'district': 'Meerut',
                'village': 'Daurala',
                'is_staff': True,
                'is_superuser': True
            })
            admin_user.set_password('admin123')
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.save()
        else:
            self.stdout.write(self.style.NOTICE("Skipped admin user creation as requested."))

        # Farmer 1: Ramesh Patel
        farmer1, _ = User.objects.get_or_create(username='ramesh_farmer', defaults={
            'email': 'farmer@krishiseva.in',
            'first_name': 'Ramesh',
            'last_name': 'Patel',
            'role': 'farmer',
            'phone': '+91 98765 43210',
            'state': 'Uttar Pradesh',
            'district': 'Meerut',
            'village': 'Daurala',
        })
        farmer1.set_password('farmer123')
        farmer1.save()
        FarmerProfile.objects.update_or_create(user=farmer1, defaults={
            'preferred_language': 'hi',
            'total_land_acres': 20.0,
            'primary_crops': 'Wheat, Sugarcane, Mustard',
            'address': 'Khet No. 14, Daurala Sugar Mill Road, Meerut'
        })

        # Farmer 2: Mohan Lal
        farmer2, _ = User.objects.get_or_create(username='mohan_farmer', defaults={
            'email': 'mohan@krishiseva.in',
            'first_name': 'Mohan',
            'last_name': 'Lal',
            'role': 'farmer',
            'phone': '+91 98765 43211',
            'state': 'Uttar Pradesh',
            'district': 'Meerut',
            'village': 'Sardhana',
        })
        farmer2.set_password('farmer123')
        farmer2.save()
        FarmerProfile.objects.update_or_create(user=farmer2, defaults={
            'preferred_language': 'hi',
            'total_land_acres': 12.0,
            'primary_crops': 'Mustard, Wheat',
            'address': 'Near Church Road, Sardhana'
        })

        # Worker 1: Suresh Kumar
        worker1, _ = User.objects.get_or_create(username='suresh_worker', defaults={
            'email': 'worker@krishiseva.in',
            'first_name': 'Suresh',
            'last_name': 'Kumar',
            'role': 'worker',
            'phone': '+91 98765 55501',
            'state': 'Uttar Pradesh',
            'district': 'Meerut',
            'village': 'Daurala',
        })
        worker1.set_password('worker123')
        worker1.save()
        WorkerProfile.objects.update_or_create(user=worker1, defaults={
            'skills': 'Wheat Harvesting, Combine Handling, Crop Threshing, Manual Reaping',
            'daily_wage_rate': 500.0,
            'experience_years': 5,
            'is_available': True,
            'verification_status': 'verified',
            'rating': 4.9,
            'completed_jobs_count': 18,
            'bio': 'Experienced agricultural labour team leader with 5 adult workers available for harvesting and bagging.'
        })

        # Worker 2: Dinesh Singh
        worker2, _ = User.objects.get_or_create(username='dinesh_worker', defaults={
            'email': 'dinesh@krishiseva.in',
            'first_name': 'Dinesh',
            'last_name': 'Singh',
            'role': 'worker',
            'phone': '+91 98765 55502',
            'state': 'Uttar Pradesh',
            'district': 'Meerut',
            'village': 'Sardhana',
        })
        worker2.set_password('worker123')
        worker2.save()
        WorkerProfile.objects.update_or_create(user=worker2, defaults={
            'skills': 'Paddy Sowing, Weeding, Fertilizer Spraying, Crop Guarding',
            'daily_wage_rate': 480.0,
            'experience_years': 4,
            'is_available': True,
            'verification_status': 'verified',
            'rating': 4.8,
            'completed_jobs_count': 12,
            'bio': 'Reliable farm labour specialized in spraying and harvesting assistance.'
        })

        # Provider 1: Vikram Singh (Tractor Mechanic)
        provider1, _ = User.objects.get_or_create(username='vikram_mechanic', defaults={
            'email': 'mechanic@krishiseva.in',
            'first_name': 'Vikram',
            'last_name': 'Singh',
            'role': 'provider',
            'phone': '+91 98765 66601',
            'state': 'Uttar Pradesh',
            'district': 'Meerut',
            'village': 'Daurala',
        })
        provider1.set_password('provider123')
        provider1.save()
        ProviderProfile.objects.update_or_create(user=provider1, defaults={
            'business_name': 'Kisan Tractor & Hydraulic Workshop',
            'service_categories': 'tractor_mechanic',
            'service_radius_km': 30,
            'service_villages': 'Daurala, Sardhana, Mawana, Meerut Rural',
            'is_available': True,
            'qualifications': 'ITI Diesel Mechanic Certified, 12 years field repair experience',
            'machinery_details': 'Mobile repair toolbox, hydraulic pressure gauge, welding kit',
            'verification_status': 'verified',
            'rating': 4.9,
            'completed_bookings_count': 26,
            'bio': 'Specialist in Mahindra, Swaraj, and John Deere engine overhauls, hydraulics and clutch servicing right on the farm.'
        })
        ProviderService.objects.update_or_create(
            provider=provider1,
            category=cat_map['tractor_mechanic'],
            defaults={
                'title': 'On-Farm Tractor Repair & Diagnostic Service',
                'description': 'Complete inspection, oil change, brake alignment, and hydraulic troubleshooting.',
                'base_rate': 800.0,
                'rate_unit': 'per visit',
                'equipment_models': 'Mahindra 575/585, Swaraj 744, Sonalika DI 50',
                'is_active': True,
            }
        )

        # Provider 2: Amit Verma (Tubewell Repair)
        provider2, _ = User.objects.get_or_create(username='amit_tubewell', defaults={
            'email': 'tubewell@krishiseva.in',
            'first_name': 'Amit',
            'last_name': 'Verma',
            'role': 'provider',
            'phone': '+91 98765 66602',
            'state': 'Uttar Pradesh',
            'district': 'Meerut',
            'village': 'Daurala',
        })
        provider2.set_password('provider123')
        provider2.save()
        ProviderProfile.objects.update_or_create(user=provider2, defaults={
            'business_name': 'Verma Tubewell & Motor Works',
            'service_categories': 'tubewell_repair',
            'service_radius_km': 25,
            'service_villages': 'Daurala, Jani, Sardhana',
            'is_available': True,
            'qualifications': 'Licensed Electrical Wireman, Submersible pump rewinding expert',
            'machinery_details': 'Borewell pipe winch crane, digital motor tester',
            'verification_status': 'verified',
            'rating': 4.8,
            'completed_bookings_count': 19,
            'bio': 'Fast motor rewinding, starter replacement, and borewell pipe extraction within 4 hours.'
        })
        ProviderService.objects.update_or_create(
            provider=provider2,
            category=cat_map['tubewell_repair'],
            defaults={
                'title': 'Submersible Pump & Starter Rewind Service',
                'description': 'Copper winding, starter contactor repair, and bore lifting.',
                'base_rate': 1200.0,
                'rate_unit': 'per repair',
                'equipment_models': 'Kirloskar, Crompton, Falcon 7.5HP-15HP pumps',
                'is_active': True,
            }
        )

        # Provider 3: Baldev Singh (Machinery Rental)
        provider3, _ = User.objects.get_or_create(username='baldev_machinery', defaults={
            'email': 'machinery@krishiseva.in',
            'first_name': 'Baldev',
            'last_name': 'Singh',
            'role': 'provider',
            'phone': '+91 98765 66603',
            'state': 'Uttar Pradesh',
            'district': 'Meerut',
            'village': 'Mawana',
        })
        provider3.set_password('provider123')
        provider3.save()
        ProviderProfile.objects.update_or_create(user=provider3, defaults={
            'business_name': 'Baldev Agro Equipment & Harvester Fleet',
            'service_categories': 'machinery_rental',
            'service_radius_km': 40,
            'service_villages': 'Mawana, Daurala, Hastinapur, Sardhana, Meerut Rural',
            'is_available': True,
            'qualifications': 'Registered Custom Hiring Centre Operator (CHCO)',
            'machinery_details': '2 Preet Combine Harvesters (Track & Wheel), 1 Laser Leveler, 2 Shaktiman Rotavators',
            'verification_status': 'verified',
            'rating': 4.95,
            'completed_bookings_count': 34,
            'bio': 'Punctual custom farm machinery hiring with trained operators and diesel included.'
        })
        ProviderService.objects.update_or_create(
            provider=provider3,
            category=cat_map['machinery_rental'],
            defaults={
                'title': 'Modern Combine Harvester (With Grain Tank & Straw Chopper)',
                'description': 'Clean harvesting for wheat & paddy with minimal grain loss.',
                'base_rate': 1600.0,
                'rate_unit': 'per acre',
                'equipment_models': 'Preet 987 Combined Harvester, Class Crop Tiger',
                'is_active': True,
            }
        )

        # Provider 4: Rajesh Kumar (Backup Tractor Mechanic in Sardhana)
        provider4, _ = User.objects.get_or_create(username='rajesh_mechanic', defaults={
            'email': 'rajesh@krishiseva.in',
            'first_name': 'Rajesh',
            'last_name': 'Kumar',
            'role': 'provider',
            'phone': '+91 98765 66604',
            'state': 'Uttar Pradesh',
            'district': 'Meerut',
            'village': 'Sardhana',
        })
        provider4.set_password('provider123')
        provider4.save()
        ProviderProfile.objects.update_or_create(user=provider4, defaults={
            'business_name': 'Om Shanti Agro Repairs',
            'service_categories': 'tractor_mechanic',
            'service_radius_km': 25,
            'service_villages': 'Sardhana, Daurala, Jani',
            'is_available': True,
            'qualifications': 'ITI Certified Mechanic',
            'machinery_details': 'Mobile toolkit and battery jump-starter',
            'verification_status': 'verified',
            'rating': 4.7,
            'completed_bookings_count': 11,
            'bio': 'Reliable village tractor mechanic available for swift emergency breakdown support.'
        })
        ProviderService.objects.update_or_create(
            provider=provider4,
            category=cat_map['tractor_mechanic'],
            defaults={
                'title': 'Emergency Tractor Repair & Tune Up',
                'description': 'Quick roadside and field repairs.',
                'base_rate': 750.0,
                'rate_unit': 'per visit',
                'equipment_models': 'All major brands',
                'is_active': True,
            }
        )

        self.stdout.write(self.style.SUCCESS("Seeding Farmer's Farm and Wheat Harvesting Project..."))

        # Farm for Ramesh Patel
        farm1 = Farm.objects.create(
            farmer=farmer1,
            name="Ganga Khet — Daurala",
            village="Daurala",
            district="Meerut",
            state="Uttar Pradesh",
            size_acres=20.0,
            current_crops="Wheat (HD-3086)",
            soil_type="Fertile Alluvial Loam",
            irrigation_source="12.5 HP Electric Tubewell + Canal Channel"
        )

        today = timezone.now().date()
        harvest_date = today + datetime.timedelta(days=3)
        end_date = today + datetime.timedelta(days=7)

        # Farm Project: Wheat Harvesting 2026
        project = FarmProject.objects.create(
            farmer=farmer1,
            farm=farm1,
            name="Wheat Harvesting 2026 (20 Acres)",
            crop="Wheat",
            target_area_acres=20.0,
            start_date=harvest_date,
            expected_completion_date=end_date,
            status='planning',
            estimated_budget=42000.0,
            actual_cost=0.0,
            notes="Comprehensive coordination: Combine harvester for 20 acres, 6 workers for bagging & loading, plus pre-harvest tractor overhaul."
        )

        # 1. Project Service 1: Machinery Rental (Booked & Confirmed)
        req1 = ServiceRequest.objects.create(
            farmer=farmer1,
            category=cat_map['machinery_rental'],
            farm_project=project,
            title="Combine Harvester for 20 Acres Wheat",
            description="Need modern combine harvester with chopper for 20 acres clean wheat crop in Daurala.",
            village="Daurala",
            district="Meerut",
            state="Uttar Pradesh",
            required_date=harvest_date,
            scope_quantity="20 Acres Wheat Harvesting",
            budget_max=32000.0,
            status='booked'
        )
        ps1 = ProjectService.objects.create(
            project=project,
            category=cat_map['machinery_rental'],
            service_request=req1,
            scope_description="20 Acres Combine Harvester Rental",
            target_date=harvest_date
        )
        q1 = Quotation.objects.create(
            request=req1,
            provider=provider3,
            quote_amount=30000.0,
            price_breakdown="₹1,500/acre x 20 acres = ₹30,000 (Diesel & operator charges included)",
            notes="Preet 987 Harvester will arrive at 7:00 AM sharp on scheduled date.",
            proposed_schedule=harvest_date,
            status='accepted'
        )
        b1 = Booking.objects.create(
            reference_id="KS-2026-8812",
            request=req1,
            quotation=q1,
            farmer=farmer1,
            provider=provider3,
            agreed_amount=30000.0,
            scheduled_date=harvest_date,
            status='confirmed'
        )
        BookingEvent.objects.create(
            booking=b1,
            actor=farmer1,
            action="Quotation Accepted",
            from_status="",
            to_status="pending_confirmation",
            notes="Farmer approved quote of ₹30,000."
        )
        BookingEvent.objects.create(
            booking=b1,
            actor=provider3,
            action="Booking Confirmed",
            from_status="pending_confirmation",
            to_status="confirmed",
            notes="Provider confirmed availability and dispatched operator details."
        )

        # 2. Project Service 2: Labour (Booked & Confirmed)
        req2 = ServiceRequest.objects.create(
            farmer=farmer1,
            category=cat_map['labour'],
            farm_project=project,
            title="Harvesting, Grain Bagging & Loading Labour (5 Workers)",
            description="Need 5 adult workers for 2 days to bag wheat grain, tie bags, and stack on trolleys.",
            village="Daurala",
            district="Meerut",
            state="Uttar Pradesh",
            required_date=harvest_date,
            scope_quantity="5 Workers x 2 Days",
            budget_max=6000.0,
            status='booked'
        )
        ps2 = ProjectService.objects.create(
            project=project,
            category=cat_map['labour'],
            service_request=req2,
            scope_description="5 Labourers for 2 Days Grain Bagging",
            target_date=harvest_date
        )
        q2 = Quotation.objects.create(
            request=req2,
            provider=worker1,
            quote_amount=5000.0,
            price_breakdown="₹500/day x 5 adult workers = ₹2,500/day x 2 days = ₹5,000",
            notes="Experienced bagging team. We bring our own needles and thread for grain bags.",
            proposed_schedule=harvest_date,
            status='accepted'
        )
        b2 = Booking.objects.create(
            reference_id="KS-2026-8813",
            request=req2,
            quotation=q2,
            farmer=farmer1,
            provider=worker1,
            agreed_amount=5000.0,
            scheduled_date=harvest_date,
            status='confirmed'
        )
        BookingEvent.objects.create(
            booking=b2,
            actor=farmer1,
            action="Quotation Accepted",
            from_status="",
            to_status="pending_confirmation",
            notes="Farmer selected Suresh Kumar team."
        )
        BookingEvent.objects.create(
            booking=b2,
            actor=worker1,
            action="Booking Confirmed",
            from_status="pending_confirmation",
            to_status="confirmed",
            notes="Worker team lead Suresh Kumar confirmed work availability."
        )

        # 3. Project Service 3: Tractor Mechanic (Open Request for Demonstration!)
        # This request has 2 submitted quotes so the user can demonstrate:
        # Farmer views quotes -> accepts one -> provider confirms!
        req3 = ServiceRequest.objects.create(
            farmer=farmer1,
            category=cat_map['tractor_mechanic'],
            farm_project=project,
            title="Pre-Harvest Tractor Overhaul & Hydraulic Inspection",
            description="Inspection and routine service for Swaraj 744 tractor before wheat transport starts. Clutch check and hydraulic oil replacement.",
            village="Daurala",
            district="Meerut",
            state="Uttar Pradesh",
            required_date=today + datetime.timedelta(days=1),
            scope_quantity="1 Tractor Complete Service & Tuning",
            budget_max=1500.0,
            status='open'
        )
        ps3 = ProjectService.objects.create(
            project=project,
            category=cat_map['tractor_mechanic'],
            service_request=req3,
            scope_description="Tractor Inspection & Overhaul",
            target_date=today + datetime.timedelta(days=1)
        )
        # Quote 1 by Vikram Singh
        Quotation.objects.create(
            request=req3,
            provider=provider1,
            quote_amount=950.0,
            price_breakdown="₹750 service labour + ₹200 mobile travel and pressure testing",
            notes="Will inspect clutch plate, engine oil filter, and hydraulic lift pump on site.",
            proposed_schedule=today + datetime.timedelta(days=1),
            status='pending'
        )
        # Quote 2 by Rajesh Kumar
        Quotation.objects.create(
            request=req3,
            provider=provider4,
            quote_amount=850.0,
            price_breakdown="₹700 routine maintenance + ₹150 visit fee",
            notes="Can visit tomorrow morning at 9:00 AM.",
            proposed_schedule=today + datetime.timedelta(days=1),
            status='pending'
        )

        # Update Project calculation
        project.update_project_status()

        # Seed initial genuine review
        Review.objects.create(
            reviewer=farmer1,
            target_user=provider3,
            rating=5,
            comment="Baldev Ji delivered the combine harvester on time during last paddy season. Clean harvesting and very humble operator."
        )
        Review.objects.create(
            reviewer=farmer1,
            target_user=worker1,
            rating=5,
            comment="Suresh and his team worked tirelessly in hot sun. Bagged over 400 quintals without spilling."
        )

        # Welcome notifications
        Notification.objects.create(
            recipient=farmer1,
            title="Welcome to KrishiSeva!",
            message="खेती की हर जरूरत, एक जगह। Your farm project 'Wheat Harvesting 2026' is active with 2 confirmed bookings and 1 open request.",
            link_url="/farmer/projects"
        )
        Notification.objects.create(
            recipient=provider1,
            title="New Quotation Request in Daurala",
            message="Ramesh Patel requested a tractor mechanic service for tomorrow in Daurala. Your quote of ₹950 is under review.",
            link_url="/provider/matching"
        )

        self.stdout.write(self.style.SUCCESS("""
======================================================================
  KRISHISEVA DEMO DATA SUCCESSFULLY SEEDED!
======================================================================
  Fictional Demo Logins (Password: <role>123 or admin123):
  
  1. Farmer:
     Username: ramesh_farmer
     Password: farmer123
     Role: Farmer (20 Acres Farm in Daurala, Meerut)
     
  2. Agricultural Worker:
     Username: suresh_worker
     Password: worker123
     Role: Worker (Harvesting Lead, ₹500/day, 4.9★)
     
  3. Service Provider (Tractor Mechanic):
     Username: vikram_mechanic
     Password: provider123
     Role: Provider (Kisan Tractor Workshop, ITI Certified, 4.9★)

  4. Service Provider (Machinery Rental):
     Username: baldev_machinery
     Password: provider123
     Role: Provider (Baldev Agro Fleet, Combine Harvesters, 4.95★)

  5. Service Provider (Tubewell Repair):
     Username: amit_tubewell
     Password: provider123
     Role: Provider (Verma Tubewell & Motor Works, 4.8★)

  6. Admin:
     Username: admin
     Password: admin123
     Role: Administrator (Access to Django Admin /admin/)

======================================================================
"""))
