"""
Management Command: seed_institutional_resources
Seeds Module 12: Government & Institutional Connect directory records.
Uses verified official government portals, ICAR institutes, and KVK references.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from services.models import InstitutionalResource

class Command(BaseCommand):
    help = "Seed verified official agricultural schemes, ICAR institutes, KVKs, and portals for Module 12."

    def handle(self, *args, **options):
        self.stdout.write("Seeding verified government and institutional directory records...")

        resources = [
            {
                'name_en': 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
                'name_hi': 'प्रधानमंत्री किसान सम्मान निधि (पीएम-किसान)',
                'category': 'central_scheme',
                'description_en': 'Income support of ₹6,000 per year in three equal installments to all landholding farmer families across India.',
                'description_hi': 'सभी पात्र भूमिधारक किसान परिवारों को ₹6,000 प्रति वर्ष तीन समान किश्तों में प्रत्यक्ष आय सहायता।',
                'official_url': 'https://pmkisan.gov.in/',
                'geographic_coverage': 'All India / Pan-India',
                'implementing_agency': 'Department of Agriculture and Farmers Welfare (DA&FW)',
                'contact_info': 'Toll Free: 155261 / 1800115526',
                'display_order': 1,
            },
            {
                'name_en': 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
                'name_hi': 'प्रधानमंत्री फसल बीमा योजना (पीएमएफबीवाई)',
                'category': 'central_scheme',
                'description_en': 'Comprehensive crop insurance coverage against non-preventable natural risks from pre-sowing to post-harvest losses.',
                'description_hi': 'बुवाई पूर्व से लेकर कटाई उपरांत प्राकृतिक आपदाओं से फसल नुकसान के विरुद्ध व्यापक फसल बीमा सुरक्षा।',
                'official_url': 'https://pmfby.gov.in/',
                'geographic_coverage': 'All India / Pan-India',
                'implementing_agency': 'Ministry of Agriculture & Farmers Welfare',
                'contact_info': 'Toll Free Helpline: 14447',
                'display_order': 2,
            },
            {
                'name_en': 'Soil Health Card Scheme (SHC)',
                'name_hi': 'मृदा स्वास्थ्य कार्ड योजना',
                'category': 'central_scheme',
                'description_en': 'Periodic soil testing providing crop-wise nutrient status and tailored organic/inorganic fertilizer dosage recommendations.',
                'description_hi': 'खेत की मिट्टी की नियमित जांच कर पोषक तत्वों की स्थिति एवं संतुलित उर्वरक उपयोग की सिफारिश प्रदान करना।',
                'official_url': 'https://soilhealth.dac.gov.in/',
                'geographic_coverage': 'All India / Pan-India',
                'implementing_agency': 'Department of Agriculture & Cooperation',
                'contact_info': 'District Agriculture Office / KVK',
                'display_order': 3,
            },
            {
                'name_en': 'Sub-Mission on Agricultural Mechanization (SMAM)',
                'name_hi': 'कृषि यंत्रीकरण पर उप-मिशन (एसएमएएम)',
                'category': 'central_scheme',
                'description_en': 'Financial assistance and subsidy for purchasing agricultural machinery, tractors, rotavators, and setting up Custom Hiring Centres (CHCs).',
                'description_hi': 'कृषि यंत्रों, ट्रैक्टरों और कस्टम हायरिंग सेंटरों (सीएचसी) की स्थापना पर सब्सिडी एवं वित्तीय सहायता।',
                'official_url': 'https://agrimachinery.nic.in/',
                'geographic_coverage': 'All India / Uttar Pradesh / Haryana / Punjab',
                'implementing_agency': 'Mechanization & Technology Division, DA&FW',
                'contact_info': 'Portal Helpline: 011-23382937',
                'display_order': 4,
            },
            {
                'name_en': 'Kisan Credit Card (KCC) Scheme',
                'name_hi': 'किसान क्रेडिट कार्ड (केसीसी) योजना',
                'category': 'central_scheme',
                'description_en': 'Timely and adequate credit to farmers for agricultural cultivation expenses, input purchase, and post-harvest maintenance at subsidized interest rates.',
                'description_hi': 'रियायती ब्याज दर पर कृषि लागत, खाद-बीज और कटाई उपरांत खर्चों के लिए किसानों को संस्थागत ऋण।',
                'official_url': 'https://myscheme.gov.in/schemes/kcc',
                'geographic_coverage': 'All India / Pan-India',
                'implementing_agency': 'NABARD & Commercial/Cooperative Banks',
                'contact_info': 'Bank Branch / PM-KISAN Portal',
                'display_order': 5,
            },
            {
                'name_en': 'ICAR - Indian Institute of Wheat and Barley Research (IIWBR)',
                'name_hi': 'भा.कृ.अनु.प. - भारतीय गेहूं एवं जौ अनुसंधान संस्थान (आईआईडब्ल्यूबीआर)',
                'category': 'icar_institute',
                'description_en': 'Premier national research institute coordinating wheat and barley genetic improvement, crop management, and breeder seed supply.',
                'description_hi': 'गेहूं और जौ की उन्नत किस्मों, फसल प्रबंधन और प्रजनक बीज आपूर्ति का राष्ट्रीय नोडल अनुसंधान संस्थान।',
                'official_url': 'https://www.iiwbr.org/',
                'geographic_coverage': 'North-Western Plains Zone (Meerut, Western UP, Punjab, Haryana)',
                'implementing_agency': 'Indian Council of Agricultural Research (ICAR)',
                'contact_info': 'Karnal, Haryana - Tel: 0184-2267490',
                'display_order': 6,
            },
            {
                'name_en': 'ICAR - Indian Institute of Sugarcane Research (IISR)',
                'name_hi': 'भा.कृ.अनु.प. - भारतीय गन्ना अनुसंधान संस्थान (आईआईएसआर)',
                'category': 'icar_institute',
                'description_en': 'National research center on sugarcane cultivation techniques, ratoon management, and mechanization equipment development.',
                'description_hi': 'गन्ना उत्पादन तकनीक, पेड़ी (रेटून) प्रबंधन और गन्ना यंत्रीकरण उपकरणों पर राष्ट्रीय अनुसंधान केंद्र।',
                'official_url': 'https://iisr.icar.gov.in/',
                'geographic_coverage': 'Subtropical India (Uttar Pradesh, Bihar, Haryana)',
                'implementing_agency': 'Indian Council of Agricultural Research (ICAR)',
                'contact_info': 'Lucknow, Uttar Pradesh - Tel: 0522-2480726',
                'display_order': 7,
            },
            {
                'name_en': 'Krishi Vigyan Kendra (KVK) Meerut - SVPUAT',
                'name_hi': 'कृषि विज्ञान केंद्र (केवीके) मेरठ - एसवीपीयूएटी',
                'category': 'kvk',
                'description_en': 'District agricultural science center providing frontline demonstrations, seed testing, vocational farmer training, and farm advisory.',
                'description_hi': 'मेरठ जिले के किसानों के लिए उन्नत कृषि प्रदर्शन, बीज परीक्षण, किसान प्रशिक्षण और तकनीकी सलाह केंद्र।',
                'official_url': 'https://kvk.icar.gov.in/',
                'geographic_coverage': 'District Meerut & Surrounding Western UP',
                'implementing_agency': 'Sardar Vallabhbhai Patel University of Agriculture & Technology (SVPUAT)',
                'contact_info': 'Modipuram, Meerut, UP 250110',
                'display_order': 8,
            },
            {
                'name_en': 'National Agriculture Market (e-NAM) / SFAC India',
                'name_hi': 'राष्ट्रीय कृषि बाजार (ई-नाम) / एसएफएसी इंडिया',
                'category': 'portal',
                'description_en': 'Pan-India electronic trading portal networking physical APMC mandis to create a unified national market for agricultural commodities.',
                'description_hi': 'कृषि जिंसों के लिए मंडियों को ऑनलाइन जोड़ने वाला अखिल भारतीय इलेक्ट्रॉनिक ट्रेडिंग नेटवर्क।',
                'official_url': 'https://www.enam.gov.in/',
                'geographic_coverage': 'All India / Pan-India',
                'implementing_agency': 'Small Farmers Agribusiness Consortium (SFAC)',
                'contact_info': 'Helpdesk Toll Free: 1800 270 0224',
                'display_order': 9,
            },
            {
                'name_en': 'UP Agriculture Farmer Assistance Portal (पारदर्शी किसान सेवा योजना)',
                'name_hi': 'उत्तर प्रदेश पारदर्शी किसान सेवा पोर्टल',
                'category': 'state_scheme',
                'description_en': 'Direct Benefit Transfer (DBT) portal for seeds, fertilizers, agricultural implements, and solar pump subsidies for UP farmers.',
                'description_hi': 'उ.प्र. किसानों के लिए बीज, कृषि रक्षा रसायन, कृषि यंत्र एवं सोलर पंप पर डीबीटी अनुदान पंजीकरण पोर्टल।',
                'official_url': 'http://upagriculture.com/',
                'geographic_coverage': 'State of Uttar Pradesh (Meerut, Muzaffarnagar, Bulandshahr, etc.)',
                'implementing_agency': 'Department of Agriculture, Government of Uttar Pradesh',
                'contact_info': 'Kisan Helpline: 1800-180-1551',
                'display_order': 10,
            }
        ]

        count = 0
        for r in resources:
            obj, created = InstitutionalResource.objects.update_or_create(
                name_en=r['name_en'],
                defaults={
                    'name_hi': r['name_hi'],
                    'category': r['category'],
                    'description_en': r['description_en'],
                    'description_hi': r['description_hi'],
                    'official_url': r['official_url'],
                    'geographic_coverage': r['geographic_coverage'],
                    'implementing_agency': r['implementing_agency'],
                    'contact_info': r['contact_info'],
                    'display_order': r['display_order'],
                    'is_verified': True,
                    'last_reviewed_date': timezone.now().date()
                }
            )
            count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {count} verified institutional directory entries."))
