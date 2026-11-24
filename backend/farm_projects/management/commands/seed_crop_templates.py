from django.core.management.base import BaseCommand
from farm_projects.models import CropTemplate, CropOperationTemplate
from services.models import ServiceCategory

class Command(BaseCommand):
    help = "Seeds standardized, editable workflow templates for the 6 core crops and variants."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding 6 core crop workflow templates and variants..."))

        cat_map = {c.slug: c for c in ServiceCategory.objects.all()}

        templates_def = [
            # 1. Wheat
            {
                'slug': 'wheat',
                'crop_name_en': 'Wheat',
                'crop_name_hi': 'गेहूं',
                'variant_name_en': 'Standard High-Yielding',
                'variant_name_hi': 'उन्नत सिंचित गेहूं',
                'season': 'Rabi',
                'typical_duration_days': 135,
                'version': 'v1.0',
                'description_en': 'Complete package of operations for irrigated wheat cultivation in Indo-Gangetic Plains.',
                'description_hi': 'सिंचित गेहूं की संपूर्ण कार्य योजना (जुताई, बुवाई, सिंचाई, कटाई एवं अवशेष प्रबंधन)।',
                'operations': [
                    (1, 'Land Preparation & Ploughing', 'खेत की जुताई एवं तैयारी', 'Land Preparation', 'land_preparation', 0, 3, True, 'Deep MB ploughing followed by rotavator.'),
                    (2, 'Pre-sowing Paleva Irrigation', 'पलेवा सिंचाई', 'Irrigation', 'irrigation', 5, 2, True, 'Pre-sowing irrigation to establish optimal seedbed moisture.'),
                    (3, 'Seed Bed Preparation', 'रोटावेटर द्वारा पाटा लगाना', 'Land Preparation', 'land_preparation', 10, 2, True, 'Fine pulverization and seedbed leveling.'),
                    (4, 'Drill Sowing & Basal Fertilizer', 'सीड ड्रिल द्वारा बुवाई व बेसल खाद', 'Sowing', 'sowing_planting', 12, 2, True, 'Seed-cum-fertilizer drill sowing with certified seed.'),
                    (5, 'Crown Root (CRI) First Irrigation', 'सीआरआई अवस्था पहली सिंचाई', 'Irrigation', 'irrigation', 33, 3, True, 'Critical first irrigation 21-25 days after germination.'),
                    (6, 'First Weeding & Herbicide Spray', 'निराई-गुड़ाई एवं खरपतवार नियंत्रण', 'Weeding & Protection', 'labour', 45, 3, True, 'Broad-leaf and narrow-leaf weed management.'),
                    (7, 'Tillering Stage Second Irrigation', 'कल्ले फूटते समय दूसरी सिंचाई', 'Irrigation', 'irrigation', 60, 3, True, 'Irrigation aligned with active tillering.'),
                    (8, 'Flowering Stage Third Irrigation', 'फूल एवं बाली निकलते समय तीसरी सिंचाई', 'Irrigation', 'irrigation', 85, 3, True, 'Maintains soil moisture during heading and anthesis.'),
                    (9, 'Pre-Harvest Agronomic Inspection', 'कटाई पूर्व फसल स्वास्थ्य निरीक्षण', 'Inspection', 'crop_inspection', 120, 2, False, 'Maturity assessment and grain moisture check.'),
                    (10, 'Combine Harvesting & Threshing', 'कंबाइन हार्वेस्टर कटाई व मड़ाई', 'Harvesting', 'harvesting', 135, 2, True, 'Self-propelled combine harvesting.'),
                    (11, 'Straw Reaping / Bhusa Making', 'स्ट्रॉ रीपर द्वारा भूसा निर्माण', 'Residue Management', 'residue_management', 138, 2, True, 'Residue recovery and livestock fodder processing.'),
                    (12, 'Grain Transportation to Mandi / Godown', 'मंडी / गोदाम तक अनाज ढुलाई', 'Transportation', 'transportation', 140, 2, True, 'Tractor trolley grain transport.'),
                ]
            },
            # 2A. Paddy Transplanted
            {
                'slug': 'paddy_transplanted',
                'crop_name_en': 'Paddy (Transplanted)',
                'crop_name_hi': 'धान (रोपाई पद्धति)',
                'variant_name_en': 'Transplanted Basmati/Non-Basmati',
                'variant_name_hi': 'पारंपरिक रोपाई पद्धति',
                'season': 'Kharif',
                'typical_duration_days': 130,
                'version': 'v1.0',
                'description_en': 'Nursery raising, puddling, manual/machine transplanting, and harvest workflow.',
                'description_hi': 'पौधशाला नर्सरी, खेत की कदवा (पडलिंग), रोपाई और कंबाइन कटाई।',
                'operations': [
                    (1, 'Nursery Bed Preparation & Sowing', 'नर्सरी तैयार करना एवं बीज बुवाई', 'Nursery', 'nursery_transplanting', 0, 3, True, 'Raised bed nursery sowing for 25-30 day seedlings.'),
                    (2, 'Main Field Puddling & Bund Leveling', 'खेत की कदवा (पडलिंग) एवं मेड़बंदी', 'Land Preparation', 'land_preparation', 25, 3, True, 'Wet tillage and soil puddling.'),
                    (3, 'Seedling Uprooting & Transplanting', 'पौध उखाड़ना एवं खेत में रोपाई', 'Sowing', 'nursery_transplanting', 30, 3, True, 'Manual or mechanical transplanter operations with 2-3 seedlings per hill.'),
                    (4, 'First Top Dressing & Nitrogen', 'पहली यूरिया टॉप ड्रेसिंग', 'Nutrient Management', 'input_supply', 45, 2, True, 'Nitrogen application at active tillering.'),
                    (5, 'Manual Weeding (Khurpi)', 'खुरपी द्वारा हाथ से निराई', 'Weeding', 'labour', 55, 3, True, 'Manual weed removal in standing water.'),
                    (6, 'Panicle Initiation Irrigation', 'बालियां बनते समय सिंचाई', 'Irrigation', 'irrigation', 75, 2, True, 'Water maintenance at panicle development.'),
                    (7, 'Pest Scouting & Brown Planthopper Inspection', 'कीट व रोग निरीक्षण (बीपीएच)', 'Inspection', 'crop_inspection', 95, 2, False, 'Field scouting for BPH and sheath blight.'),
                    (8, 'Paddy Combine Harvesting', 'धान कंबाइन हार्वेस्टर कटाई', 'Harvesting', 'harvesting', 130, 2, True, 'Harvesting with SMS residue attachment.'),
                    (9, 'Straw Baling & Residue Incorporation', 'पराली बेलर एवं अवशेष प्रबंधन', 'Residue Management', 'residue_management', 133, 2, True, 'Ex-situ baling or in-situ mulcher incorporation.'),
                    (10, 'Mandi Delivery Transport', 'मंडी तक धान ढुलाई', 'Transportation', 'transportation', 135, 2, True, 'Trolley transport to APMC mandi.'),
                ]
            },
            # 2B. Paddy DSR
            {
                'slug': 'paddy_dsr',
                'crop_name_en': 'Paddy (Direct-Seeded / DSR)',
                'crop_name_hi': 'धान (सीधी बुवाई / डीएसआर)',
                'variant_name_en': 'Direct-Seeded Rice (Tar-Watter)',
                'variant_name_hi': 'तर-वत्तर सीधी बिजाई',
                'season': 'Kharif',
                'typical_duration_days': 120,
                'version': 'v1.0',
                'description_en': 'Water-saving direct seeded rice workflow using precision seed drill in tar-watter conditions.',
                'description_hi': 'पानी की बचत वाली सीधी बिजाई (लेजर लेवलिंग, डीएसआर ड्रिल बुवाई)।',
                'operations': [
                    (1, 'Precision Laser Land Leveling', 'लेजर लैंड लेवलर समतलीकरण', 'Land Preparation', 'land_preparation', 0, 2, True, 'Crucial for uniform water and seedling emergence.'),
                    (2, 'Pre-sowing Tar-Watter Irrigation', 'तर-वत्तर पलेवा सिंचाई', 'Irrigation', 'irrigation', 3, 2, True, 'Heavy irrigation for optimum soil moisture.'),
                    (3, 'DSR Seed Drill Direct Sowing', 'डीएसआर सीड ड्रिल बुवाई', 'Sowing', 'sowing_planting', 7, 2, True, 'Precision direct seeding at 2-3 cm depth.'),
                    (4, 'Pre-emergence Herbicide Spray', 'जमाव पूर्व खरपतवार नाशक स्प्रे', 'Weeding & Protection', 'labour', 9, 1, True, 'Application within 48 hours of sowing.'),
                    (5, 'First Post-sowing Irrigation (21 Days)', 'बुवाई के 21 दिन बाद पहली सिंचाई', 'Irrigation', 'irrigation', 28, 2, True, 'Timed to promote deep root system.'),
                    (6, 'Tillering Nutrient Top Dressing', 'कल्ले फूटते समय पोषक तत्व', 'Nutrient Management', 'input_supply', 45, 2, True, 'Urea and zinc sulphate application.'),
                    (7, 'Foliar Health Inspection', 'पत्तियों एवं तना छेदक निरीक्षण', 'Inspection', 'crop_inspection', 70, 2, False, 'Stem borer scouting.'),
                    (8, 'Grain Filling Moisture Management', 'दूधिया अवस्था सिंचाई प्रबंधन', 'Irrigation', 'irrigation', 85, 2, True, 'Ensures bold grain weight.'),
                    (9, 'Direct Harvest with Combine', 'कंबाइन द्वारा सीधी कटाई', 'Harvesting', 'harvesting', 120, 2, True, 'Timely combine harvest.'),
                    (10, 'Crop Residue Management', 'सुपर सीडर / पराली प्रबंधन', 'Residue Management', 'residue_management', 123, 2, True, 'In-situ residue management.'),
                ]
            },
            # 3A. Sugarcane New
            {
                'slug': 'sugarcane_new',
                'crop_name_en': 'Sugarcane (New Planting)',
                'crop_name_hi': 'गन्ना (नई बुवाई / पौधा)',
                'variant_name_en': 'Plant Cane (Autumn/Spring)',
                'variant_name_hi': 'शरद / बसंत कालीन पौधा गन्ना',
                'season': 'Annual',
                'typical_duration_days': 360,
                'version': 'v1.0',
                'description_en': 'Annual plant cane lifecycle: deep trenching, sett planting, earthing up, and sugar mill delivery.',
                'description_hi': 'पौधा गन्ने की संपूर्ण वार्षिक कार्य योजना: गहरी जुताई, ट्रेंच बुवाई, बंधाई एवं मिल ढुलाई।',
                'operations': [
                    (1, 'Deep Tillage & Trench Opening', 'गहरी जुताई एवं ट्रेंच / खूंटी बनाना', 'Land Preparation', 'land_preparation', 0, 3, True, 'Deep chisel ploughing and 4-feet trench opening.'),
                    (2, 'Sett Cutting & Fungicide Treatment', 'गन्ना पोरियों की कटाई एवं उपचार', 'Sowing', 'labour', 10, 2, True, '2-bud sett cutting and bio-fungicide dip.'),
                    (3, 'Sett Planting & Furrow Covering', 'ट्रेंच में गन्ने की बुवाई व पाटा', 'Sowing', 'sowing_planting', 12, 2, True, 'Sett placement and light 2-inch soil cover.'),
                    (4, 'Germination Irrigation', 'अंकुरण सिंचाई', 'Irrigation', 'irrigation', 18, 3, True, 'Ensures uniform eye-bud sprouting.'),
                    (5, 'First Hoeing & Weeding', 'पहली गुड़ाई एवं खरपतवार नियंत्रण', 'Weeding', 'labour', 45, 3, True, 'Aerates soil around emerging tillers.'),
                    (6, 'First Top Dressing & Earthing Up', 'यूरिया टॉप ड्रेसिंग एवं मिट्टी चढ़ाना', 'Labour', 'labour', 90, 3, True, 'Prevents lodging during monsoon winds.'),
                    (7, 'Cane Propping / Bandhai', 'गन्ने की बंधाई कार्य', 'Protection', 'labour', 160, 4, True, 'Tying cane clumps together to prevent lodging.'),
                    (8, 'Borer & Pyrilla Inspection', 'तना छेदक व कीट निरीक्षण', 'Inspection', 'crop_inspection', 220, 2, False, 'Agronomic scouting for top borer and red rot.'),
                    (9, 'Brix Sugar Maturation Check', 'मिठास (ब्रिक्स) एवं परिपक्वता जांच', 'Inspection', 'crop_inspection', 330, 2, False, 'Refractometer sweetness maturity test.'),
                    (10, 'Manual Cane Harvesting & Loading', 'गन्ना छिलाई, कटाई एवं लोडिंग', 'Harvesting', 'harvesting', 360, 5, True, 'Sharp knife ground cutting and detrashing.'),
                    (11, 'Hydraulic Trolley Mill Transport', 'चीनी मिल / क्रशर गन्ना ढुलाई', 'Transportation', 'transportation', 363, 2, True, 'Tipping trolley transport on mill indent.'),
                ]
            },
            # 3B. Sugarcane Ratoon
            {
                'slug': 'sugarcane_ratoon',
                'crop_name_en': 'Sugarcane (Ratoon)',
                'crop_name_hi': 'गन्ना (पेड़ी / रतून)',
                'variant_name_en': 'First/Second Ratoon Cane',
                'variant_name_hi': 'प्रथम / द्वितीय पेड़ी प्रबंधन',
                'season': 'Annual',
                'typical_duration_days': 300,
                'version': 'v1.0',
                'description_en': 'Ratoon management: stubble shaving, inter-row subsoiling, earthing up, and mill delivery.',
                'description_hi': 'पेड़ी गन्ने की कार्य योजना: ठूंठ छंटाई, खाद ड्रेसिंग, बंधाई और कटाई।',
                'operations': [
                    (1, 'Stubble Shaving & Trash Mulching', 'ठूंठ छंटाई (स्टबल शेविंग) व मल्चिंग', 'Residue Management', 'residue_management', 0, 3, True, 'Flush ground cutting to stimulate deep underground buds.'),
                    (2, 'Inter-row Subsoiling & Off-barring', 'लाइनों के बीच जुताई व जड़ छंटाई', 'Land Preparation', 'land_preparation', 7, 2, True, 'Root pruning and compact soil breaking.'),
                    (3, 'Basal Fertilizer Top Dressing', 'नाइट्रोजन व पोटाश खाद ड्रेसिंग', 'Nutrient Management', 'input_supply', 15, 2, True, '25% extra nitrogen for ratoon vigor.'),
                    (4, 'First Ratoon Irrigation', 'पेड़ी की पहली सिंचाई', 'Irrigation', 'irrigation', 20, 2, True, 'Initiates fast sprout emergence.'),
                    (5, 'Earthing Up & Interculture', 'मिट्टी चढ़ाना एवं गुड़ाई', 'Labour', 'labour', 65, 3, True, 'Ridge re-establishment.'),
                    (6, 'Ratoon Clump Tying', 'पेड़ी बंधाई कार्य', 'Protection', 'labour', 140, 3, True, 'Supports taller ratoon stalks.'),
                    (7, 'Cane Health Inspection', 'रोग व कीट जांच', 'Inspection', 'crop_inspection', 200, 2, False, 'Checks for smut and wilt.'),
                    (8, 'Ratoon Cane Harvesting', 'पेड़ी कटाई व छिलाई', 'Harvesting', 'harvesting', 300, 4, True, 'Timely ratoon harvesting (ripens early).'),
                    (9, 'Mill Delivery Transport', 'चीनी मिल गन्ना परिवहन', 'Transportation', 'transportation', 303, 2, True, 'Mill delivery on indent schedule.'),
                ]
            },
            # 4. Mustard
            {
                'slug': 'mustard',
                'crop_name_en': 'Mustard',
                'crop_name_hi': 'सरसों',
                'variant_name_en': 'High-Oil Indian Mustard (Rai)',
                'variant_name_hi': 'उन्नत पीली / काली सरसों',
                'season': 'Rabi',
                'typical_duration_days': 115,
                'version': 'v1.0',
                'description_en': 'Fine tilth preparation, line sowing, thinning, pod development, and threshing.',
                'description_hi': 'बारीक जुताई, लाइन बुवाई, विरलीकरण, सिंचाई, कटाई एवं मड़ाई।',
                'operations': [
                    (1, 'Fine Tilth Land Preparation', 'खेत की बारीक जुताई एवं पाटा', 'Land Preparation', 'land_preparation', 0, 2, True, 'Fine, pulverized seedbed essential for small mustard seed.'),
                    (2, 'Seed-cum-Fertilizer Drill Sowing', 'सीड ड्रिल द्वारा कतार बुवाई', 'Sowing', 'sowing_planting', 5, 2, True, 'Line spacing 30 cm with certified treated seed.'),
                    (3, 'Thinning (Plant-to-Plant Spacing)', 'विरलीकरण (पौधे से पौधे की दूरी 10 सेमी)', 'Weeding', 'labour', 20, 3, True, 'Critical operation to avoid overcrowding.'),
                    (4, 'Flowering Stage First Irrigation', 'फूल आने से पहले पहली सिंचाई', 'Irrigation', 'irrigation', 38, 2, True, 'Irrigation at 35-40 days; avoid standing water.'),
                    (5, 'Aphid (Chepa) & Disease Scouting', 'माहू (चेपा) कीट एवं रोग निरीक्षण', 'Inspection', 'crop_inspection', 65, 2, False, 'Aphid threshold check and advisories.'),
                    (6, 'Pod Development Second Irrigation', 'फलियों में दाना बनते समय सिंचाई', 'Irrigation', 'irrigation', 75, 2, True, 'Maintains oil percentage and seed weight.'),
                    (7, 'Manual Harvesting / Reaper Cutting', 'सुबह के समय फसल कटाई', 'Harvesting', 'harvesting', 115, 3, True, 'Harvesting before pod shattering in morning hours.'),
                    (8, 'Threshing, Winnowing & Cleaning', 'मल्टीक्रॉप थ्रेशर द्वारा मड़ाई व सफाई', 'Post-Harvest', 'post_harvest', 120, 2, True, 'Stationary engine/tractor thresher separation.'),
                    (9, 'Mandi Oilseed Sale Transport', 'तेल मिल / मंडी परिवहन', 'Transportation', 'transportation', 123, 2, True, 'Safe bagging and transportation.'),
                ]
            },
            # 5A. Maize Grain
            {
                'slug': 'maize_grain',
                'crop_name_en': 'Maize (Grain)',
                'crop_name_hi': 'मक्का (दाना)',
                'variant_name_en': 'Hybrid Grain Maize',
                'variant_name_hi': 'उन्नत संकर मक्का',
                'season': 'Kharif',
                'typical_duration_days': 105,
                'version': 'v1.0',
                'description_en': 'Hybrid grain maize production: ridge sowing, fall armyworm scouting, and mechanical shelling.',
                'description_hi': 'संकर मक्का कार्य योजना: मेड़ पर बुवाई, कीट निगरानी, दाना मड़ाई।',
                'operations': [
                    (1, 'Ridge & Furrow Land Preparation', 'मेड़ एवं नाली विधि से जुताई', 'Land Preparation', 'land_preparation', 0, 2, True, 'Ridge and furrow formation for drainage.'),
                    (2, 'Precision Sowing with Planter', 'मक्का प्लांटर द्वारा बुवाई', 'Sowing', 'sowing_planting', 5, 2, True, '60 cm row x 20 cm plant spacing.'),
                    (3, 'Pre-emergence Herbicide Spray', 'जमाव पूर्व खरपतवार नियंत्रण', 'Weeding', 'labour', 7, 1, True, 'Atrazine application within 48 hours.'),
                    (4, 'Knee-high Stage Urea Top Dressing', 'घुटने की ऊंचाई पर यूरिया टॉप ड्रेसिंग', 'Nutrient Management', 'input_supply', 30, 2, True, 'Second split nitrogen.'),
                    (5, 'Tasseling & Silking Stage Irrigation', 'नर व मादा फूल निकलते समय सिंचाई', 'Irrigation', 'irrigation', 55, 2, True, 'Critical water sensitive stage.'),
                    (6, 'Fall Armyworm Scouting & Inspection', 'फॉल आर्मीवर्म कीट निरीक्षण', 'Inspection', 'crop_inspection', 65, 2, False, 'Whirl scouting for FAW larvae.'),
                    (7, 'Mature Cob Harvesting', 'पके भुट्टों की तुड़ाई', 'Harvesting', 'harvesting', 105, 3, True, 'Manual cob picking and desheathing.'),
                    (8, 'Mechanical Shelling & Cleaning', 'मक्का शेलर द्वारा दाना निकालना', 'Post-Harvest', 'post_harvest', 110, 2, True, 'Cob shelling and grain grading.'),
                ]
            },
            # 5B. Maize Fodder
            {
                'slug': 'maize_fodder',
                'crop_name_en': 'Maize (Fodder)',
                'crop_name_hi': 'मक्का (हरा चारा)',
                'variant_name_en': 'High-Biomass Fodder Maize',
                'variant_name_hi': 'पशु आहार हरा चारा',
                'season': 'Zaid',
                'typical_duration_days': 60,
                'version': 'v1.0',
                'description_en': 'Short-duration nutritious summer green fodder for dairy cattle.',
                'description_hi': '60 दिन का पौष्टिक हरा चारा: सघन बुवाई, त्वरित सिंचाई, कटाई।',
                'operations': [
                    (1, 'Quick Tillage & Planking', 'जुताई एवं पाटा लगाना', 'Land Preparation', 'land_preparation', 0, 2, True, 'Standard seedbed preparation.'),
                    (2, 'High-Density Drill Sowing', 'सघन कतार बुवाई', 'Sowing', 'sowing_planting', 4, 1, True, 'Higher seed rate for succulent green fodder.'),
                    (3, 'Vegetative Stage Irrigation', 'वानस्पतिक वृद्धि सिंचाई', 'Irrigation', 'irrigation', 18, 2, True, 'Promotes rapid stalk elongation.'),
                    (4, 'Pre-tasseling Irrigation & Urea', 'फूल आने से पूर्व सिंचाई व खाद', 'Irrigation', 'irrigation', 35, 2, True, 'Enhances green biomass protein.'),
                    (5, 'Succulent Green Fodder Harvesting', 'दूधिया भुट्टे बनने पर चारा कटाई', 'Harvesting', 'harvesting', 60, 3, True, 'Ground harvesting for livestock feed.'),
                    (6, 'On-farm Chaff Cutting & Loading', 'कुट्टी काटना एवं लोडिंग', 'Post-Harvest', 'transportation', 62, 2, True, 'Power chaff cutter processing.'),
                ]
            },
            # 6. Potato
            {
                'slug': 'potato',
                'crop_name_en': 'Potato',
                'crop_name_hi': 'आलू',
                'variant_name_en': 'Table & Processing Potato',
                'variant_name_hi': 'उन्नत आलू उत्पादन',
                'season': 'Rabi',
                'typical_duration_days': 95,
                'version': 'v1.0',
                'description_en': 'Intensive potato management: automatic planting, earthing up, late blight scouting, and digger harvesting.',
                'description_hi': 'आलू की गहन कार्य योजना: स्वचालित प्लांटर बुवाई, मिट्टी चढ़ाना, झुलसा रोग निगरानी, डिगर कटाई।',
                'operations': [
                    (1, 'Deep Tillage & FYM Incorporation', 'गहरी जुताई एवं गोबर खाद मिलाना', 'Land Preparation', 'land_preparation', 0, 3, True, 'Deep loose soil required for tuber development.'),
                    (2, 'Automatic Planter Tuber Planting', 'आलू प्लांटर द्वारा बुवाई व मेड़ बनाना', 'Sowing', 'sowing_planting', 7, 2, True, 'Treated seed tuber placement at 20 cm spacing.'),
                    (3, 'Light Germination Irrigation', 'हल्की पहली सिंचाई', 'Irrigation', 'irrigation', 14, 2, True, 'Light water; avoid submerging ridges.'),
                    (4, 'Earthing Up (Mitti Chadhana)', 'मिट्टी चढ़ाना (कंद ढकना)', 'Weeding', 'labour', 30, 3, True, 'Prevents greening of developing tubers.'),
                    (5, 'Late Blight Scouting & Inspection', 'पिछेता झुलसा रोग निरीक्षण', 'Inspection', 'crop_inspection', 45, 2, False, 'Weather-driven late blight monitoring.'),
                    (6, 'Tuber Bulking Irrigation', 'आलू का आकार बढ़ने के समय सिंचाई', 'Irrigation', 'irrigation', 60, 2, True, 'Optimal moisture for grade-A tubers.'),
                    (7, 'Dehaulming (Cutting Foliage)', 'बेल काटना (डिहॉलमिंग)', 'Pre-Harvest', 'labour', 85, 2, True, 'Cutting haulms 10-12 days before digging to harden tuber skin.'),
                    (8, 'Tractor Potato Digger Harvesting', 'आलू खुदाई मशीन (डिगर) द्वारा कटाई', 'Harvesting', 'harvesting', 95, 3, True, 'Mechanical digger elevator lifting.'),
                    (9, 'Field Manual Picking & Grading', 'खेत में आलू बीनना एवं ग्रेडिंग', 'Post-Harvest', 'labour', 97, 3, True, 'Sorting by size (seed, table, small).'),
                    (10, 'Cold Storage Transport & Stacking', 'शीतगृह (कोल्ड स्टोर) ढुलाई', 'Transportation', 'transportation', 100, 2, True, 'Transportation to registered cold storage.'),
                ]
            },
        ]

        created_templates = 0
        created_ops = 0

        for tdata in templates_def:
            ops_data = tdata.pop('operations')
            slug = tdata['slug']
            crop_tmpl, _ = CropTemplate.objects.update_or_create(slug=slug, defaults=tdata)
            created_templates += 1

            for seq, name_en, name_hi, stage, cat_slug, off_start, off_dur, is_mand, desc in ops_data:
                svc_cat = cat_map.get(cat_slug)
                CropOperationTemplate.objects.update_or_create(
                    crop_template=crop_tmpl,
                    sequence_order=seq,
                    defaults={
                        'operation_name_en': name_en,
                        'operation_name_hi': name_hi,
                        'stage': stage,
                        'default_service_category': svc_cat,
                        'offset_start_days': off_start,
                        'offset_duration_days': off_dur,
                        'is_mandatory': is_mand,
                        'description': desc
                    }
                )
                created_ops += 1

        self.stdout.write(self.style.SUCCESS(
            f"Successfully seeded {created_templates} Crop Templates with {created_ops} Operation Steps!\n"
            f"  - Crops supported: Wheat, Paddy (Transplanted & DSR), Sugarcane (New & Ratoon), Mustard, Maize (Grain & Fodder), Potato."
        ))
