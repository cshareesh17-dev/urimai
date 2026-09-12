import { useState, useRef, useEffect } from "react";
import { api } from "./api";

const RED = "#c0392b", DARK = "#1a1a1a";

function getToken() { return localStorage.getItem("urimai_token"); }
function setToken(t) { localStorage.setItem("urimai_token", t); }
function clearToken() { localStorage.removeItem("urimai_token"); }

// Official TNEA seat percentages from DoTE / tneaonline.org
const TNEA_SEATS = [
  { cat: "OC (Open Competition)", seats: "26.5%", color: "#555" },
  { cat: "BC (Backward Class)", seats: "26.5%", color: "#1a4e8b" },
  { cat: "BCM (BC Muslim)", seats: "3.5%", color: "#1a5e8b" },
  { cat: "MBC & DNC", seats: "20%", color: "#7b2d8b" },
  { cat: "SC (Scheduled Caste)", seats: "15%", color: "#1a6b3c" },
  { cat: "SCA (Arunthathiyar)", seats: "3%", color: "#0d4a28" },
  { cat: "ST (Scheduled Tribe)", seats: "1%", color: "#2d6b2d" },
  { cat: "7.5% Govt School (within each category)", seats: "7.5%", color: "#b85c00" },
];

const TNPSC_DATA = [
  { id: "g1", name: "Group 1", full: "Deputy Collector, DSP, Commercial Tax Officer",
    qual_en: "Any Degree", qual_ta: "ஏதேனும் பட்டப்படிப்பு",
    age: { OC: "21–32", BC: "21 – No upper limit ⭐", MBC: "21 – No upper limit ⭐", SC: "21 – No upper limit ⭐", ST: "21 – No upper limit ⭐", EWS: "21–35" },
    fee: { OC: "₹150", BC: "₹150", MBC: "₹150", SC: "Free (₹0)", ST: "Free (₹0)", EWS: "₹150" },
    stages_en: ["Preliminary Exam (Objective)", "Main Exam (Descriptive)", "Oral Test (Interview)"],
    stages_ta: ["முதற்தேர்வு (குறும்வினா)", "முதன்மைத் தேர்வு (விளக்கவினா)", "வாய்மொழி தேர்வு"],
    posts_en: ["Deputy Collector", "Dy. Superintendent of Police", "Commercial Tax Officer", "District Registrar"],
    posts_ta: ["துணை ஆட்சியர்", "துணை கண்காணிப்பாளர்", "வணிக வரி அதிகாரி", "மாவட்ட பதிவாளர்"] },
  { id: "g2", name: "Group 2", full: "Revenue Inspector, Lab Assistant – with Interview",
    qual_en: "Any Degree", qual_ta: "ஏதேனும் பட்டப்படிப்பு",
    age: { OC: "18–32", BC: "18 – No upper limit ⭐", MBC: "18 – No upper limit ⭐", SC: "18 – No upper limit ⭐", ST: "18 – No upper limit ⭐", EWS: "18–35" },
    fee: { OC: "₹150", BC: "₹150", MBC: "₹150", SC: "Free (₹0)", ST: "Free (₹0)", EWS: "₹150" },
    stages_en: ["Preliminary Exam (Objective)", "Main Exam (Objective)", "Oral Test"],
    stages_ta: ["முதற்தேர்வு (குறும்வினா)", "முதன்மைத் தேர்வு (குறும்வினா)", "வாய்மொழி தேர்வு"],
    posts_en: ["Revenue Inspector", "Lab Assistant", "Junior Employment Officer"],
    posts_ta: ["வருவாய் ஆய்வாளர்", "ஆய்வக உதவியாளர்", "வேலைவாய்ப்பு அலுவலர்"] },
  { id: "g2a", name: "Group 2A", full: "Junior Assistant, Typist – NO Interview",
    qual_en: "Degree / HSC (varies by post)", qual_ta: "பட்டப்படிப்பு / மேல்நிலை",
    age: { OC: "18–32", BC: "18 – No upper limit ⭐", MBC: "18 – No upper limit ⭐", SC: "18 – No upper limit ⭐", ST: "18 – No upper limit ⭐", EWS: "18–35" },
    fee: { OC: "₹100", BC: "₹100", MBC: "₹100", SC: "Free (₹0)", ST: "Free (₹0)", EWS: "₹100" },
    stages_en: ["Written Exam Only (Objective) – NO Interview"],
    stages_ta: ["எழுத்துத் தேர்வு மட்டும் – நேர்காணல் இல்லை"],
    posts_en: ["Junior Assistant", "Typist", "Steno-Typist", "Bill Collector"],
    posts_ta: ["இளநிலை உதவியாளர்", "தட்டச்சர்", "எழுத்தர்-தட்டச்சர்"] },
  { id: "g4", name: "Group 4", full: "VAO, Typist – HSC level, NO Interview",
    qual_en: "Higher Secondary (10+2)", qual_ta: "மேல்நிலை (10+2)",
    age: { OC: "18–32", BC: "18–34 ⭐", MBC: "18–34 ⭐", SC: "18–35 ⭐", ST: "18–35 ⭐", EWS: "18–34" },
    fee: { OC: "₹75", BC: "₹75", MBC: "₹75", SC: "Free (₹0)", ST: "Free (₹0)", EWS: "₹75" },
    stages_en: ["Written Exam Only (Objective) – NO Interview"],
    stages_ta: ["எழுத்துத் தேர்வு மட்டும் – நேர்காணல் இல்லை"],
    posts_en: ["Village Administrative Officer (VAO)", "Typist", "Junior Assistant"],
    posts_ta: ["கிராம நிர்வாக அலுவலர் (VAO)", "தட்டச்சர்", "இளநிலை உதவியாளர்"] },
];

const UPSC_DATA = [
  { id: "cse", name: "Civil Services (IAS/IPS/IFS)",
    qual_en: "Any Degree (final year students also eligible)",
    qual_ta: "ஏதேனும் பட்டப்படிப்பு (இறுதி ஆண்டு மாணவர்களும் தகுதியானவர்கள்)",
    age: { OC: "21–32", "OBC/BC": "21–35 (+3 yrs)", SC: "21–37 (+5 yrs)", ST: "21–37 (+5 yrs)", EWS: "21–32", PH: "Up to 42 (+10 yrs)" },
    fee: { OC: "₹100", "OBC/BC": "₹100", SC: "Free (Exempt)", ST: "Free (Exempt)", Women: "Free (Exempt)" },
    attempts: { OC: "6 attempts", "OBC/BC": "9 attempts", SC: "Unlimited till age 37", ST: "Unlimited till age 37", EWS: "6 attempts" },
    stages_en: ["Prelims – 2 papers (GS + CSAT) Objective", "Mains – 9 papers Descriptive (written)", "Personality Test / Interview (275 marks)"],
    stages_ta: ["முதற்தேர்வு – 2 தாள்கள் குறும்வினா", "முதன்மைத் தேர்வு – 9 தாள்கள் விளக்கவினா", "ஆளுமைத் தேர்வு / நேர்காணல்"],
    tips_en: ["SC/ST: 5 extra years + UNLIMITED attempts – biggest UPSC advantage!", "OBC/BC: 3 extra years + 9 attempts (OC gets only 6)", "Women: Completely FREE application fee", "PH candidates: 10 extra years age relaxation"],
    tips_ta: ["SC/ST: 5 கூடுதல் வயது + வரம்பற்ற முயற்சிகள் – UPSC-ல் மிகப்பெரிய சலுகை!", "OBC/BC: 3 கூடுதல் வயது + 9 முயற்சிகள்", "பெண்கள்: விண்ணப்பக் கட்டணம் முழுவதும் இலவசம்"],
    posts_en: ["IAS – Indian Administrative Service", "IPS – Indian Police Service", "IFS – Indian Foreign Service", "IRS – Indian Revenue Service", "200+ Central Services"],
    posts_ta: ["IAS – இந்திய நிர்வாக சேவை", "IPS – இந்திய போலீஸ் சேவை", "IFS – இந்திய வெளிநாட்டு சேவை"] },
  { id: "capf", name: "CAPF (BSF/CRPF/CISF/SSB)",
    qual_en: "Any Degree", qual_ta: "ஏதேனும் பட்டப்படிப்பு",
    age: { OC: "20–25", "OBC/BC": "20–28 (+3 yrs)", SC: "20–30 (+5 yrs)", ST: "20–30 (+5 yrs)", EWS: "20–25" },
    fee: { OC: "₹200", "OBC/BC": "₹200", SC: "Free (Exempt)", ST: "Free (Exempt)", Women: "Free (Exempt)" },
    attempts: { OC: "4 attempts", "OBC/BC": "7 attempts", SC: "Unlimited till 30", ST: "Unlimited till 30" },
    stages_en: ["Paper I – General Ability (Objective)", "Paper II – General Studies, Essay (Descriptive)", "Physical Efficiency Test (PET)", "Medical Test", "Interview"],
    stages_ta: ["தாள் I – பொது திறன் (குறும்வினா)", "தாள் II – பொது அறிவு, கட்டுரை (விளக்கவினா)", "உடல் திறன் தேர்வு", "மருத்துவ தேர்வு", "நேர்காணல்"],
    tips_en: ["SC/ST: 5 extra years + unlimited attempts", "Women: FREE application fee", "Physical fitness is mandatory – start training early!"],
    tips_ta: ["SC/ST: 5 கூடுதல் வயது + வரம்பற்ற முயற்சிகள்", "பெண்கள்: இலவச விண்ணப்பக் கட்டணம்"],
    posts_en: ["Assistant Commandant – BSF", "Assistant Commandant – CRPF", "Assistant Commandant – CISF", "Assistant Commandant – SSB"],
    posts_ta: ["உதவி தண்டல் அதிகாரி – BSF", "உதவி தண்டல் அதிகாரி – CRPF", "உதவி தண்டல் அதிகாரி – CISF"] },
];

// Fact-checked reservation data – removed Magalir Urimai & Free Bus (govt ads)
// Women reservation corrected to 40% announced (not confirmed universal implementation)
// TNEA percentages updated to official DoTE figures
const RESERVATIONS = [
  { id: "sc", color: "#1a6b3c", icon: "🔵",
    title_en: "SC / ST Reservation", title_ta: "SC / ST இட ஒதுக்கீடு",
    percent: "SC:15% SCA:3% ST:1%", type: "Education & Jobs",
    tnea_en: "✅ TNEA Official: SC=15%, SCA=3%, ST=1%",
    tnea_ta: "✅ TNEA அதிகாரப்பூர்வ: SC=15%, SCA=3%, ST=1%",
    desc_en: "Reserved seats in all TN govt engineering (TNEA), medical (NEET TN), polytechnic and arts & science colleges. Also 15%+3%+1% in all state govt jobs.",
    desc_ta: "TN அரசு பொறியியல் (TNEA), மருத்துவம் (NEET TN), பாலிடெக்னிக் மற்றும் கலை & அறிவியல் கல்லூரிகளிலும் அரசு வேலைகளிலும் இட ஒதுக்கீடு.",
    docs_en: ["Community Certificate – Tahsildar office (Free, 7–15 days)", "Income Certificate – Tahsildar (for scholarships)", "Nativity Certificate – Tahsildar", "Aadhaar Card", "School Transfer Certificate", "10th & 12th Mark sheets"],
    docs_ta: ["சமூக சான்றிதழ் – தாலுக்கா (இலவசம், 7–15 நாட்கள்)", "வருமான சான்றிதழ்", "தாய்நாடு சான்றிதழ்", "ஆதார் அட்டை", "இட மாறு சான்றிதழ்", "மதிப்பெண் பட்டியல்"],
    schemes: [
      { en: "SC/ST Post-Matric Scholarship", ta: "SC/ST மேல்நிலை பின் உதவித்தொகை",
        amount: "₹3,500–₹12,000/year", deadline: "Apply by Sep 30 annually",
        desc_en: "Central & State scholarship for SC/ST students in higher education. Covers tuition, maintenance allowance. Many eligible students miss this due to unawareness – MUST apply every year!",
        desc_ta: "உயர் கல்வியில் SC/ST மாணவர்களுக்கு மத்திய & மாநில உதவித்தொகை. கட்டணம் மற்றும் பராமரிப்பு அடங்கும். பல தகுதியான மாணவர்கள் தெரியாமல் தவறவிடுகிறார்கள் – ஒவ்வொரு ஆண்டும் விண்ணப்பிக்க வேண்டும்!",
        apply_en: "Apply online:\n• scholarships.gov.in (National Scholarship Portal)\n• OR scholarship.tn.gov.in\n\nDocuments needed:\n• Community Certificate\n• Income Certificate\n• Bank account number + Aadhaar\n• College admission/bonafide certificate\n\n⚠️ Deadline: Sep 30 each year – do NOT miss!",
        apply_ta: "ஆன்லைனில் விண்ணப்பிக்கவும்:\n• scholarships.gov.in\n• அல்லது scholarship.tn.gov.in\n\nதேவையான ஆவணங்கள்:\n• சமூக சான்றிதழ்\n• வருமான சான்றிதழ்\n• வங்கி கணக்கு எண் + ஆதார்\n• கல்லூரி சேர்க்கை சான்றிதழ்\n\n⚠️ கடைசி தேதி: செப்டம்பர் 30!" },
      { en: "Free Education up to PG (Govt Colleges)", ta: "PG வரை இலவச கல்வி (அரசு கல்லூரிகள்)",
        amount: "Full tuition fee waiver", deadline: "At time of admission",
        desc_en: "Complete tuition fee exemption for SC/ST students in all Tamil Nadu government colleges from UG up to post-graduation. Show Community Certificate at admission – automatic exemption.",
        desc_ta: "TN அரசு கல்லூரிகளில் SC/ST மாணவர்களுக்கு UG முதல் PG வரை முழு கட்டண விலக்கு. சமூக சான்றிதழ் காட்டினால் தானாகவே கிடைக்கும்.",
        apply_en: "Show Community Certificate at college admission office.\n\nFee exemption is AUTOMATIC for govt colleges.\nFor private aided colleges: Apply separately with Community Certificate + Income Certificate.",
        apply_ta: "கல்லூரி சேர்க்கை அலுவலகத்தில் சமூக சான்றிதழ் காட்டவும். அரசு கல்லூரிகளில் தானாகவே கட்டண விலக்கு கிடைக்கும்." },
      { en: "SC/ST Free Govt Hostel", ta: "SC/ST இலவச அரசு விடுதி",
        amount: "Free stay + food", deadline: "Apply before June 30",
        desc_en: "Free hostel with food for SC/ST students in government-run hostels. Limited seats – apply early. Especially useful for village students studying in cities.",
        desc_ta: "SC/ST மாணவர்களுக்கு அரசு விடுதிகளில் இலவச தங்குமிடம் மற்றும் உணவு. இடங்கள் குறைவு – முன்னதாக விண்ணப்பிக்கவும். கிராம மாணவர்களுக்கு மிகவும் பயனுள்ளது.",
        apply_en: "Apply at: District SC/ST Welfare Officer office\n\nDocuments:\n• Community Certificate\n• Income Certificate\n• College admission proof\n\nApply before June 30 for next academic year.",
        apply_ta: "விண்ணப்பிக்கவும்: மாவட்ட SC/ST நல அதிகாரி அலுவலகம்\n\nஆவணங்கள்:\n• சமூக சான்றிதழ்\n• வருமான சான்றிதழ்\n• கல்லூரி சேர்க்கை சான்று" },
      { en: "Dr. Ambedkar Fellowship (PG/Research)", ta: "டாக்டர் அம்பேத்கர் ஃபெலோஷிப்",
        amount: "₹25,000–₹28,000/month", deadline: "As per UGC annual notification",
        desc_en: "Monthly fellowship for SC/ST students doing PG and research. Funded by UGC. Highly valuable for students planning Masters or PhD.",
        desc_ta: "PG மற்றும் ஆராய்ச்சி படிக்கும் SC/ST மாணவர்களுக்கு மாதாந்திர ஃபெலோஷிப். UGC நிதியளிக்கிறது.",
        apply_en: "Apply via: ugc.ac.in (National Fellowship Portal)\n\nEligibility: SC/ST + PG/research admission + NET/JRF qualification",
        apply_ta: "விண்ணப்பிக்கவும்: ugc.ac.in\n\nதகுதி: SC/ST + PG/ஆராய்ச்சி சேர்க்கை + NET/JRF" },
    ],
    applySteps: [
      { en: "Get Community Certificate from Tahsildar office – Free, takes 7–15 working days. Apply online at tnedistrict.tn.gov.in or visit in person.", ta: "தாலுக்கா அலுவலகத்தில் சமூக சான்றிதழ் பெறவும் – இலவசம், 7–15 நாட்கள். tnedistrict.tn.gov.in இல் ஆன்லைனில் விண்ணப்பிக்கவும்." },
      { en: "Get Income Certificate and Nativity Certificate from the same Tahsildar office.", ta: "அதே தாலுக்கா அலுவலகத்தில் வருமான சான்றிதழ் மற்றும் தாய்நாடு சான்றிதழ் பெறவும்." },
      { en: "For TNEA Engineering: Register at tneaonline.org during May–June. Select your community (SC/ST/SCA). Upload all scanned certificates.", ta: "TNEA பொறியியல்: மே–ஜூன் மாதத்தில் tneaonline.org இல் பதிவு செய்யவும். SC/ST/SCA பிரிவு தேர்வு செய்யவும். ஸ்கேன் சான்றிதழ்கள் பதிவேற்றவும்." },
      { en: "Attend certificate verification at TFC (TNEA Facilitation Centre) with ALL original documents.", ta: "அனைத்து அசல் ஆவணங்களுடன் TFC-ல் சான்றிதழ் சரிபார்ப்பிற்கு வரவும்." },
      { en: "For Scholarship: Apply at scholarships.gov.in BEFORE September 30 every year. Need bank account linked to Aadhaar.", ta: "உதவித்தொகை: ஒவ்வொரு ஆண்டும் செப்டம்பர் 30 க்கு முன் scholarships.gov.in இல் விண்ணப்பிக்கவும். ஆதார் இணைக்கப்பட்ட வங்கி கணக்கு தேவை." },
      { en: "For Govt Jobs (TNPSC): Apply at tnpsc.gov.in when notification is released. SC/ST get FREE exam and NO upper age limit.", ta: "அரசு வேலை (TNPSC): அறிவிப்பு வெளியானபோது tnpsc.gov.in இல் விண்ணப்பிக்கவும். SC/ST க்கு இலவச தேர்வு மற்றும் வயது வரம்பு இல்லை." },
    ],
    offices: [
      { name: "Tahsildar Office", for_en: "Community Certificate, Income Certificate, Nativity Certificate – ALL FREE", contact: "Visit your nearest Taluk / Tahsildar office. Online: tnedistrict.tn.gov.in" },
      { name: "District SC/ST Welfare Officer", for_en: "Hostel application, Scholarship grievances, Welfare schemes", contact: "Located at district headquarters / collectorate" },
      { name: "TNEA Online Portal", for_en: "Engineering college admission application", contact: "tneaonline.org (open May–July each year)" },
      { name: "National Scholarship Portal", for_en: "Post-Matric Scholarship – apply before Sep 30", contact: "scholarships.gov.in" },
    ],
    eligible: (d) => ["SC (Scheduled Caste)", "ST (Scheduled Tribe)"].includes(d.category) },

  { id: "bc", color: "#1a4e8b", icon: "🔷",
    title_en: "BC Reservation – 26.5%", title_ta: "BC இட ஒதுக்கீடு – 26.5%",
    percent: "BC:26.5% BCM:3.5%", type: "Education & Jobs",
    tnea_en: "✅ TNEA Official: BC=26.5%, BCM (BC Muslim)=3.5%",
    tnea_ta: "✅ TNEA அதிகாரப்பூர்வ: BC=26.5%, BCM=3.5%",
    desc_en: "26.5% seats in TNEA engineering, NEET medical, all govt colleges and 26.5% posts in all TN state govt jobs for BC community.",
    desc_ta: "BC சமூகத்தினருக்கு TNEA பொறியியல், NEET மருத்துவம், அரசு கல்லூரிகளிலும் வேலைகளிலும் 26.5% இட ஒதுக்கீடு.",
    docs_en: ["BC Community Certificate – Tahsildar (Free)", "Nativity Certificate – Tahsildar", "Income Certificate – Tahsildar", "Aadhaar Card", "Ration Card", "Transfer Certificate"],
    docs_ta: ["BC சமூக சான்றிதழ் – தாலுக்கா (இலவசம்)", "தாய்நாடு சான்றிதழ்", "வருமான சான்றிதழ்", "ஆதார் அட்டை", "ரேஷன் அட்டை", "இட மாறு சான்றிதழ்"],
    schemes: [
      { en: "BC Post-Matric Scholarship", ta: "BC மேல்நிலை பின் உதவித்தொகை",
        amount: "₹2,000–₹8,000/year", deadline: "Apply by Sep 30 annually",
        desc_en: "Annual scholarship for BC students in govt higher education. Apply EVERY year – many students forget to re-apply and lose the benefit!",
        desc_ta: "அரசு உயர் கல்வியில் BC மாணவர்களுக்கு வருடாந்திர உதவித்தொகை. ஒவ்வொரு ஆண்டும் விண்ணப்பிக்க வேண்டும்!",
        apply_en: "Apply online:\n• scholarships.gov.in\n• OR scholarship.tn.gov.in\n\nDocuments: BC Community Certificate + Income Certificate + Bank account + Aadhaar + College admission proof\n\n⚠️ Deadline: Sep 30 each year",
        apply_ta: "ஆன்லைனில்: scholarships.gov.in அல்லது scholarship.tn.gov.in\n\nஆவணங்கள்: BC சமூக சான்றிதழ் + வருமான சான்றிதழ் + வங்கி கணக்கு + ஆதார்\n\n⚠️ கடைசி தேதி: செப்டம்பர் 30" },
      { en: "FREE Coaching for TNPSC/UPSC (BC Welfare)", ta: "TNPSC/UPSC இலவச பயிற்சி (BC நல துறை)",
        amount: "Free (market value ₹30,000+)", deadline: "Apply when notified",
        desc_en: "Tamil Nadu BC Welfare Dept provides FREE coaching for TNPSC (all groups), UPSC, Banking, Railway exams. A huge opportunity that many BC students don't know about!",
        desc_ta: "TN BC நல துறை TNPSC, UPSC, வங்கி, ரயில்வே தேர்வுகளுக்கு இலவச பயிற்சி. பல BC மாணவர்களுக்கு தெரியாத மிகப்பெரிய வாய்ப்பு!",
        apply_en: "Apply at: District BC & MBC Welfare Officer\n\nEligibility:\n• BC community certificate\n• Age 18–30\n• Annual family income below ₹2.5 Lakhs\n\nApply as soon as notification is released.",
        apply_ta: "விண்ணப்பிக்கவும்: மாவட்ட BC & MBC நல அதிகாரி\n\nதகுதி:\n• BC சமூக சான்றிதழ்\n• வயது 18–30\n• வருமானம் ₹2.5 லட்சத்திற்கு கீழ்" },
      { en: "BC Self-Employment Loan (Subsidised)", ta: "BC சுய தொழில் மானிய கடன்",
        amount: "Up to ₹1,00,000", deadline: "Apply anytime at welfare office",
        desc_en: "Subsidised loan from TN BC Welfare Corporation to start own business. Interest subsidy available. Income limit applies.",
        desc_ta: "TN BC நல கார்பரேஷன் மூலம் சொந்த தொழில் தொடங்க மானிய கடன். வட்டி மானியம் கிடைக்கும்.",
        apply_en: "Apply at: Tamil Nadu BC Welfare Corporation, district office\n\nDocuments: BC Certificate + Income proof + Business plan + Aadhaar",
        apply_ta: "விண்ணப்பிக்கவும்: TN BC நல கார்பரேஷன், மாவட்ட அலுவலகம்\n\nஆவணங்கள்: BC சான்றிதழ் + வருமான ஆதாரம் + தொழில் திட்டம்" },
    ],
    applySteps: [
      { en: "Get BC Community Certificate from Tahsildar office – Free, takes 7–15 days. Apply at tnedistrict.tn.gov.in", ta: "BC சமூக சான்றிதழ் – தாலுக்கா அலுவலகம் – இலவசம், 7–15 நாட்கள்." },
      { en: "Get Income Certificate and Nativity Certificate from Tahsildar.", ta: "வருமான சான்றிதழ் மற்றும் தாய்நாடு சான்றிதழ் – தாலுக்கா அலுவலகம்." },
      { en: "For TNEA: Register at tneaonline.org (May–June), select BC category, upload all certificates.", ta: "TNEA: tneaonline.org இல் பதிவு (மே–ஜூன்), BC பிரிவு தேர்வு, ஆவணங்கள் பதிவேற்று." },
      { en: "For FREE Coaching: Visit District BC & MBC Welfare Officer office and apply when notification is released.", ta: "இலவச பயிற்சி: மாவட்ட BC & MBC நல அதிகாரி அலுவலகம் சென்று விண்ணப்பிக்கவும்." },
      { en: "For Scholarship: Apply at scholarships.gov.in before September 30 each year.", ta: "உதவித்தொகை: ஒவ்வொரு ஆண்டும் செப்டம்பர் 30 க்கு முன் scholarships.gov.in இல் விண்ணப்பிக்கவும்." },
      { en: "For Self-Employment Loan: Visit TN BC Welfare Corporation district office with BC certificate, income proof and business plan.", ta: "சுய தொழில் கடன்: TN BC நல கார்பரேஷன் மாவட்ட அலுவலகம் – BC சான்றிதழ், வருமான ஆதாரம், தொழில் திட்டம்." },
    ],
    offices: [
      { name: "Tahsildar Office", for_en: "BC Community Certificate, Income Certificate, Nativity Certificate – FREE", contact: "Your nearest Taluk office | tnedistrict.tn.gov.in" },
      { name: "District BC & MBC Welfare Officer", for_en: "Free coaching application, Scholarship grievances, Loan enquiry", contact: "District headquarters / collectorate" },
      { name: "TN BC Welfare Corporation", for_en: "Self-employment loan application", contact: "District office of TNBC Welfare Corporation" },
    ],
    eligible: (d) => d.category === "BC (Backward Class)" },

  { id: "mbc", color: "#7b2d8b", icon: "🟣",
    title_en: "MBC / DNC Reservation – 20%", title_ta: "MBC / DNC இட ஒதுக்கீடு – 20%",
    percent: "20%", type: "Education & Jobs",
    tnea_en: "✅ TNEA Official: MBC & DNC = 20%",
    tnea_ta: "✅ TNEA அதிகாரப்பூர்வ: MBC & DNC = 20%",
    desc_en: "20% seats in TNEA engineering, NEET medical, all govt colleges and 20% posts in all TN state govt jobs for MBC & DNC communities.",
    desc_ta: "TNEA பொறியியல், NEET மருத்துவம், அரசு கல்லூரிகளிலும் வேலைகளிலும் MBC & DNC சமூகத்தினருக்கு 20%.",
    docs_en: ["MBC/DNC Community Certificate – Tahsildar (Free)", "Nativity Certificate", "Income Certificate", "Aadhaar Card", "Ration Card"],
    docs_ta: ["MBC/DNC சமூக சான்றிதழ் – தாலுக்கா (இலவசம்)", "தாய்நாடு சான்றிதழ்", "வருமான சான்றிதழ்", "ஆதார் அட்டை", "ரேஷன் அட்டை"],
    schemes: [
      { en: "MBC Post-Matric Scholarship", ta: "MBC மேல்நிலை பின் உதவித்தொகை",
        amount: "₹2,000–₹8,000/year", deadline: "Apply by Sep 30 annually",
        desc_en: "Annual scholarship for MBC/DNC students in govt higher education. Apply every year – many miss this! Apply at scholarships.gov.in",
        desc_ta: "அரசு உயர் கல்வி நிறுவனங்களில் MBC/DNC மாணவர்களுக்கு வருடாந்திர உதவித்தொகை. தவறவிடாதீர்கள்!",
        apply_en: "Apply online:\n• scholarships.gov.in\n• OR scholarship.tn.gov.in\n\nDocuments: MBC/DNC Certificate + Income Certificate + Bank account + College admission proof",
        apply_ta: "ஆன்லைனில்: scholarships.gov.in அல்லது scholarship.tn.gov.in\n\nஆவணங்கள்: MBC/DNC சமூக சான்றிதழ் + வருமான சான்றிதழ் + வங்கி கணக்கு" },
      { en: "FREE Coaching for TNPSC/UPSC (MBC Welfare)", ta: "TNPSC/UPSC இலவச பயிற்சி (MBC நல துறை)",
        amount: "Free coaching", deadline: "Apply as per notification",
        desc_en: "FREE coaching for TNPSC, UPSC, Banking exams for MBC/DNC candidates from TN MBC & Minority Welfare Dept. Most village students are unaware of this!",
        desc_ta: "TN MBC & சிறுபான்மையினர் நல துறை மூலம் TNPSC, UPSC, வங்கி தேர்வுகளுக்கு இலவச பயிற்சி. பெரும்பாலான கிராம மாணவர்களுக்கு இது தெரியவில்லை!",
        apply_en: "Apply at: District MBC & Minority Welfare Officer\n\nEligibility: MBC/DNC certificate + Age 18–30 + Income below ₹2.5L",
        apply_ta: "விண்ணப்பிக்கவும்: மாவட்ட MBC & சிறுபான்மையினர் நல அதிகாரி\n\nதகுதி: MBC/DNC சான்றிதழ் + வயது 18–30 + வருமானம் ₹2.5L கீழ்" },
      { en: "MBC Self-Employment Loan", ta: "MBC சுய தொழில் கடன்",
        amount: "Up to ₹75,000 (subsidised)", deadline: "Apply anytime",
        desc_en: "Subsidised loan for MBC/DNC candidates to start own business or trade.",
        desc_ta: "MBC/DNC வேட்பாளர்களுக்கு சொந்த தொழில் தொடங்க மானிய கடன்.",
        apply_en: "Apply at: TN MBC & Minority Welfare Corporation, district office\n\nDocuments: MBC/DNC Certificate + Income proof + Business plan + Aadhaar",
        apply_ta: "விண்ணப்பிக்கவும்: TN MBC & சிறுபான்மையினர் நல கார்பரேஷன், மாவட்ட அலுவலகம்" },
    ],
    applySteps: [
      { en: "Get MBC/DNC Community Certificate from Tahsildar office – Free. Apply online at tnedistrict.tn.gov.in", ta: "MBC/DNC சமூக சான்றிதழ் – தாலுக்கா அலுவலகம் – இலவசம். tnedistrict.tn.gov.in இல் விண்ணப்பிக்கவும்." },
      { en: "Get Income Certificate and Nativity Certificate from Tahsildar.", ta: "வருமான சான்றிதழ் மற்றும் தாய்நாடு சான்றிதழ் – தாலுக்கா அலுவலகம்." },
      { en: "For TNEA: Register at tneaonline.org (May–June), select MBC/DNC category, upload all certificates.", ta: "TNEA: tneaonline.org இல் பதிவு, MBC/DNC பிரிவு தேர்வு, ஆவணங்கள் பதிவேற்று." },
      { en: "For FREE Coaching: Visit District MBC & Minority Welfare Officer and apply as per notification.", ta: "இலவச பயிற்சி: மாவட்ட MBC & சிறுபான்மையினர் நல அதிகாரி அலுவலகம் சென்று விண்ணப்பிக்கவும்." },
      { en: "For Scholarship: Apply at scholarships.gov.in before September 30 each year. Re-apply every year!", ta: "உதவித்தொகை: ஒவ்வொரு ஆண்டும் செப்டம்பர் 30 க்கு முன் scholarships.gov.in இல் விண்ணப்பிக்கவும்!" },
    ],
    offices: [
      { name: "Tahsildar Office", for_en: "MBC/DNC Community, Income, Nativity Certificates – FREE", contact: "Your nearest Taluk office | tnedistrict.tn.gov.in" },
      { name: "District MBC & Minority Welfare Officer", for_en: "Free coaching, Scholarship, Loan applications", contact: "District headquarters" },
      { name: "TN MBC Welfare Corporation", for_en: "Self-employment loan", contact: "MBC Welfare Corporation district office" },
    ],
    eligible: (d) => d.category === "MBC / DNC" },

  { id: "q75", color: "#b85c00", icon: "🏫",
    title_en: "7.5% Govt School Quota", title_ta: "7.5% அரசு பள்ளி இட ஒதுக்கீடு",
    percent: "7.5%", type: "Education",
    tnea_en: "✅ TNEA: 7.5% extra WITHIN each community category for students who studied Std 6–12 entirely in TN Govt school",
    tnea_ta: "✅ TNEA: ஒவ்வொரு சமூக பிரிவிற்குள்ளும் 6–12 வரை TN அரசு பள்ளியில் மட்டுமே படித்தவர்களுக்கு 7.5% கூடுதல்",
    desc_en: "7.5% of seats within each community category reserved for students who studied Std 6–12 ENTIRELY in TN Govt schools. Works in TNEA (Engineering), NEET TN (Medical), Polytechnic. Your competition is only other govt school students in your category – huge advantage!",
    desc_ta: "TNEA, NEET TN மற்றும் பாலிடெக்னிக்கில் ஒவ்வொரு சமூக பிரிவிற்குள்ளும் 6–12 வரை TN அரசு பள்ளியில் மட்டுமே படித்தவர்களுக்கு 7.5% கூடுதல். உங்கள் போட்டி மிகவும் குறைவு – மிகப்பெரிய சலுகை!",
    docs_en: ["⭐ Govt School Study Certificate (Std 6–12) – from School Headmaster – MOST CRITICAL", "Community Certificate – Tahsildar", "Transfer Certificate (TC) – from school", "Aadhaar Card", "10th & 12th Mark sheets", "Nativity Certificate"],
    docs_ta: ["⭐ அரசு பள்ளி படிப்பு சான்றிதழ் (வகுப்பு 6–12) – பள்ளி தலைமை ஆசிரியர் – மிக முக்கியம்", "சமூக சான்றிதழ் – தாலுக்கா", "இட மாறு சான்றிதழ் (TC)", "ஆதார் அட்டை", "மதிப்பெண் பட்டியல்", "தாய்நாடு சான்றிதழ்"],
    schemes: [
      { en: "7.5% Engineering Seats – TNEA (Step by Step)", ta: "7.5% பொறியியல் இடங்கள் – TNEA (படிப்படியான வழிகாட்டி)",
        amount: "Extra 7.5% seats within your community category", deadline: "TNEA Counselling: June–July each year",
        desc_en: "Within your community category (BC/MBC/SC/ST/OC), an extra 7.5% of seats are reserved ONLY for govt school students.\n\nExample: If you are BC + Govt school → you compete only against other BC govt school students for 7.5% pool. Much less competition!\n\n⚠️ STRICT RULES:\n• ALL classes Std 6 to 12 must be in TN Govt school\n• Even ONE year in private school = NOT eligible\n• Must be Tamil Nadu native\n• Applies on top of your community quota",
        desc_ta: "உங்கள் சமூக பிரிவிற்குள் (BC/MBC/SC/ST/OC) அரசு பள்ளி மாணவர்களுக்கு மட்டுமே 7.5% இடங்கள்.\n\nஎடுத்துக்காட்டு: BC + அரசு பள்ளி → BC அரசு பள்ளி மாணவர்களுடன் மட்டுமே போட்டி!\n\n⚠️ கண்டிப்பான விதிகள்:\n• 6 முதல் 12 வரை அனைத்தும் TN அரசு பள்ளியில் மட்டும்\n• ஒரு வருடம் தனியார் = தகுதி இல்லை\n• TN சொந்தகாரராக இருக்க வேண்டும்",
        apply_en: "Step 1: Get Govt School Study Certificate from school headmaster (covers Std 6–12)\nStep 2: Register at tneaonline.org (May–June each year)\nStep 3: Select 'Government School Quota' during registration\nStep 4: Upload Govt School Certificate + all other documents\nStep 5: Attend certificate verification at TFC (TNEA Facilitation Centre)\nStep 6: Participate in counselling rounds and choose colleges\n\nWebsite: tneaonline.org",
        apply_ta: "படி 1: பள்ளி தலைமை ஆசிரியரிடம் அரசு பள்ளி படிப்பு சான்றிதழ் பெறுங்கள் (6–12 வகுப்பு)\nபடி 2: tneaonline.org இல் பதிவு செய்யுங்கள் (மே–ஜூன்)\nபடி 3: 'Government School Quota' தேர்வு செய்யுங்கள்\nபடி 4: சான்றிதழ்கள் பதிவேற்றுங்கள்\nபடி 5: TFC-ல் ஆவண சரிபார்ப்பிற்கு வாருங்கள்\nபடி 6: கவுன்சிலிங் கலந்துகொள்ளுங்கள்" },
      { en: "7.5% Medical Seats – NEET TN", ta: "7.5% மருத்துவ இடங்கள் – NEET TN",
        amount: "Extra 7.5% MBBS/BDS seats in TN state quota", deadline: "TN NEET Counselling: July–August",
        desc_en: "7.5% of TN state quota MBBS and BDS seats in govt medical colleges reserved for govt school students within each category. Qualify NEET first, then apply in TN counselling.",
        desc_ta: "TN அரசு மருத்துவ கல்லூரிகளில் 7.5% MBBS/BDS இடங்கள் ஒவ்வொரு பிரிவிலும் அரசு பள்ளி மாணவர்களுக்கு.",
        apply_en: "Step 1: Qualify NEET exam\nStep 2: Apply in TN MBBS/BDS counselling portal\nStep 3: Select Government School Quota\nStep 4: Upload Govt School Study Certificate (Std 6–12)\nStep 5: Attend document verification",
        apply_ta: "படி 1: NEET தேர்வு தேர்ச்சி பெறுங்கள்\nபடி 2: TN MBBS/BDS கவுன்சிலிங் போர்டலில் விண்ணப்பிக்கவும்\nபடி 3: Government School Quota தேர்வு செய்யவும்" },
    ],
    applySteps: [
      { en: "Get Govt School Study Certificate (Std 6–12) from your school headmaster – this is the most critical document. It must cover ALL years from Std 6 to 12.", ta: "பள்ளி தலைமை ஆசிரியரிடம் அரசு பள்ளி படிப்பு சான்றிதழ் (6–12 வகுப்பு) பெறவும் – இது மிக முக்கியமான ஆவணம். 6 முதல் 12 வரை அனைத்து ஆண்டுகளும் இருக்க வேண்டும்." },
      { en: "Get Community Certificate, Nativity Certificate and Income Certificate from Tahsildar office.", ta: "தாலுக்கா அலுவலகத்தில் சமூக சான்றிதழ், தாய்நாடு சான்றிதழ், வருமான சான்றிதழ் பெறவும்." },
      { en: "For TNEA Engineering: Register at tneaonline.org during May–June. Select BOTH your community category AND 'Government School Quota'.", ta: "TNEA பொறியியல்: மே–ஜூன் மாதத்தில் tneaonline.org இல் பதிவு செய்யவும். உங்கள் சமூக பிரிவு மற்றும் 'Government School Quota' இரண்டையும் தேர்வு செய்யவும்." },
      { en: "Upload Govt School Study Certificate + all other required documents. Submit application.", ta: "அரசு பள்ளி படிப்பு சான்றிதழ் + அனைத்து ஆவணங்களும் பதிவேற்றவும். விண்ணப்பம் சமர்பிக்கவும்." },
      { en: "Attend certificate verification at TFC with ALL original documents including original Govt School certificate.", ta: "TFC-ல் அனைத்து அசல் ஆவணங்களுடன் – குறிப்பாக அரசு பள்ளி அசல் சான்றிதழுடன் – சரிபார்ப்பிற்கு வரவும்." },
      { en: "Participate in TNEA counselling – you will be competing ONLY against other govt school students in your category. Much less competition!", ta: "TNEA கவுன்சிலிங்கில் கலந்துகொள்ளவும் – உங்கள் பிரிவில் உள்ள அரசு பள்ளி மாணவர்களுடன் மட்டும் போட்டி. மிகவும் குறைந்த போட்டி!" },
    ],
    offices: [
      { name: "Your Old School (Headmaster)", for_en: "Govt School Study Certificate covering Std 6 to 12 – MOST IMPORTANT", contact: "Visit your old school and meet the headmaster" },
      { name: "Tahsildar Office", for_en: "Community Certificate, Nativity Certificate, Income Certificate – ALL FREE", contact: "Nearest Taluk office | tnedistrict.tn.gov.in" },
      { name: "TNEA Facilitation Centre (TFC)", for_en: "Certificate verification for engineering admission", contact: "Check tneaonline.org for nearest TFC location" },
      { name: "TN Health Dept Portal", for_en: "NEET TN medical counselling – govt school quota", contact: "tnhealth.org | mbbsadmission.tn.gov.in" },
    ],
    eligible: (d) => d.school === "govt" },

  { id: "ews", color: "#8b6914", icon: "💛",
    title_en: "EWS Reservation – 10%", title_ta: "EWS இட ஒதுக்கீடு – 10%",
    percent: "10%", type: "Education & Jobs",
    tnea_en: "⚠️ TNEA: EWS is within OC (26.5%). Mainly applies to TNPSC & central institutions.",
    tnea_ta: "⚠️ TNEA: EWS என்பது OC (26.5%) பிரிவிற்குள் வருகிறது. முக்கியமாக TNPSC & மத்திய நிறுவனங்களுக்கு.",
    desc_en: "10% reservation for General (OC) category people with annual family income below ₹8 Lakhs. Applies in TNPSC, UPSC and central institutions. Does NOT apply to SC/ST/BC/MBC who already have their own quota.",
    desc_ta: "TNPSC, UPSC மற்றும் மத்திய அரசு நிறுவனங்களில் ₹8 லட்சத்திற்கு கீழ் வருமானம் உள்ள பொது (OC) பிரிவினருக்கு 10%. SC/ST/BC/MBC க்கு பொருந்தாது.",
    docs_en: ["EWS Income Certificate from Tahsildar – income below ₹8L (MOST IMPORTANT)", "Aadhaar Card", "Ration Card", "Property/land documents (to prove no excess land/house)"],
    docs_ta: ["EWS வருமான சான்றிதழ் – தாலுக்கா – வருமானம் ₹8L கீழ் (மிக முக்கியம்)", "ஆதார் அட்டை", "ரேஷன் அட்டை", "சொத்து ஆவணங்கள்"],
    schemes: [
      { en: "10% Reservation in TNPSC & Govt Jobs", ta: "TNPSC & அரசு வேலைகளில் 10%",
        amount: "10% posts reserved for EWS", deadline: "As per each recruitment notification",
        desc_en: "10% of posts in TNPSC, UPSC and other state/central govt jobs for EWS candidates.\n\n⚠️ NOT eligible if:\n• Annual income above ₹8 Lakhs\n• Own more than 5 acres of agricultural land\n• Own house above 1000 sqft in a notified municipality",
        desc_ta: "TNPSC, UPSC மற்றும் பிற அரசு வேலைகளில் EWS க்கு 10%.\n\n⚠️ தகுதி இல்லை:\n• ₹8L மேல் வருமானம்\n• 5 ஏக்கருக்கு மேல் நிலம்\n• நகரில் 1000 sqft மேல் வீடு",
        apply_en: "Step 1: Get EWS Certificate from Tahsildar (income below ₹8L must be proven)\nStep 2: When applying for TNPSC/UPSC, select EWS category\nStep 3: Submit EWS certificate at document verification",
        apply_ta: "படி 1: தாலுக்காவில் EWS சான்றிதழ் பெறுங்கள் (₹8L கீழ் வருமானம் நிரூபிக்க வேண்டும்)\nபடி 2: TNPSC/UPSC விண்ணப்பத்தில் EWS பிரிவு தேர்வு செய்யுங்கள்" },
    ],
    applySteps: [
      { en: "Confirm you belong to General (OC) category – NOT SC/ST/BC/MBC. EWS is only for General category.", ta: "நீங்கள் பொது (OC) பிரிவை சேர்ந்தவர் என்று உறுதிப்படுத்தவும் – SC/ST/BC/MBC இல்லை. EWS பொது பிரிவுக்கு மட்டும்." },
      { en: "Check you are NOT disqualified: income must be BELOW ₹8L/year, land must be UNDER 5 acres, house must be UNDER 1000 sqft in city.", ta: "தகுதி இல்லாமல் போகாமல் சரிபார்க்கவும்: வருமானம் ₹8L கீழ், நிலம் 5 ஏக்கர் கீழ், நகர வீடு 1000 sqft கீழ்." },
      { en: "Get EWS Income Certificate from Tahsildar office – bring income documents and property papers.", ta: "தாலுக்கா அலுவலகத்தில் EWS வருமான சான்றிதழ் பெறவும் – வருமான ஆவணங்கள் மற்றும் சொத்து ஆவணங்கள் கொண்டு வரவும்." },
      { en: "For TNPSC/UPSC: When applying online, select EWS category. Submit EWS certificate at document verification.", ta: "TNPSC/UPSC: ஆன்லைனில் விண்ணப்பிக்கும்போது EWS பிரிவு தேர்வு செய்யவும். ஆவண சரிபார்ப்பில் EWS சான்றிதழ் சமர்பிக்கவும்." },
    ],
    offices: [
      { name: "Tahsildar Office", for_en: "EWS Income Certificate – MOST IMPORTANT document for this quota", contact: "Nearest Taluk / Tahsildar office | tnedistrict.tn.gov.in" },
      { name: "TNPSC Portal", for_en: "Govt job applications", contact: "tnpsc.gov.in" },
      { name: "UPSC Portal", for_en: "Central service applications", contact: "upsc.gov.in" },
    ],
    eligible: (d) => d.category === "EWS (General – Low Income)" && !["Above ₹8L", "₹8 லட்சத்திற்கு மேல்"].includes(d.income) },

  { id: "women", color: "#b8005e", icon: "👩",
    title_en: "Women Reservation – Govt Jobs", title_ta: "அரசு வேலைகளில் பெண்கள் இட ஒதுக்கீடு",
    percent: "40% announced (2021)", type: "Govt Jobs",
    tnea_en: "⚠️ TNEA: NO separate women quota in engineering. Women compete within their own community category.",
    tnea_ta: "⚠️ TNEA: பொறியியல் சேர்க்கையில் தனி பெண்கள் இட ஒதுக்கீடு இல்லை. பெண்கள் தங்கள் சமூக பிரிவிற்குள் போட்டியிடுகிறார்கள்.",
    desc_en: "TN announced increase from 30% to 40% horizontal reservation for women in TNPSC & TRB state govt jobs in September 2021. Horizontal means within each category (SC/ST/BC/MBC/OC). Always verify exact percentage in each TNPSC notification.",
    desc_ta: "TN செப்டம்பர் 2021-ல் TNPSC & TRB வேலைகளில் பெண்களுக்கான இட ஒதுக்கீட்டை 30% → 40% ஆக அதிகரிக்க அறிவிப்பு. கிடைமட்ட இட ஒதுக்கீடு – ஒவ்வொரு பிரிவிற்குள்ளும் பொருந்தும். ஒவ்வொரு TNPSC அறிவிப்பிலும் சரிபார்க்கவும்.",
    docs_en: ["Aadhaar Card", "Community Certificate", "Age Proof (10th marksheet or Birth certificate)", "Educational Certificates"],
    docs_ta: ["ஆதார் அட்டை", "சமூக சான்றிதழ்", "வயது சான்று (10வது மதிப்பெண் / பிறப்பு சான்றிதழ்)", "கல்வி சான்றிதழ்கள்"],
    schemes: [
      { en: "40% Women Reservation – TNPSC/TRB (Fact-checked)", ta: "40% பெண்கள் இட ஒதுக்கீடு – TNPSC/TRB (சரிபார்க்கப்பட்டது)",
        amount: "40% of posts within each category", deadline: "As per each TNPSC/TRB notification",
        desc_en: "40% of posts within each community category reserved for women in TNPSC and TRB.\n\n⚠️ Important: This was ANNOUNCED in Sept 2021 (increased from 30%). Implementation is ongoing via rule amendments. Always check the exact percentage in the specific recruitment notification at tnpsc.gov.in before applying.",
        desc_ta: "TNPSC மற்றும் TRB ஆட்சேர்ப்புகளில் ஒவ்வொரு சமூக பிரிவிலும் 40% பதவிகள் பெண்களுக்கு.\n\n⚠️ முக்கியம்: இது செப்டம்பர் 2021-ல் அறிவிக்கப்பட்டது. விண்ணப்பிக்கும் முன் tnpsc.gov.in இல் குறிப்பிட்ட அறிவிப்பில் சரியான சதவீதம் சரிபார்க்கவும்.",
        apply_en: "When applying in TNPSC/TRB:\n1. Select your community category (SC/ST/BC/MBC/OC/EWS)\n2. Mark gender as Female\n3. Women quota is automatically applied within your category\n\n✅ Check each notification at: tnpsc.gov.in",
        apply_ta: "TNPSC/TRB விண்ணப்பிக்கும்போது:\n1. சமூக பிரிவை தேர்வு செய்யுங்கள்\n2. பாலினம் பெண் என்று குறிக்கவும்\n3. பெண்கள் இட ஒதுக்கீடு தானாகவே பொருந்தும்\n\n✅ tnpsc.gov.in இல் ஒவ்வொரு அறிவிப்பும் சரிபார்க்கவும்" },
      { en: "Moovalur Ramamirtham Scholarship (Education – Girl Students)", ta: "மூவலூர் ராமாமிர்தம் உதவித்தொகை (கல்வி – பெண் மாணவர்கள்)",
        amount: "₹1,000/month", deadline: "Apply by Sep 30 annually",
        desc_en: "Monthly ₹1,000 scholarship for girl students pursuing higher education in govt colleges. This is an EDUCATION scheme to support girls in continuing their studies – not a govt job quota. Many first-generation girl students miss this!",
        desc_ta: "அரசு கல்லூரியில் உயர் கல்வி பயிலும் பெண் மாணவர்களுக்கு மாதம் ₹1,000 உதவித்தொகை. இது ஒரு கல்வி திட்டம் – பெண்களை படிப்பை தொடர ஊக்குவிக்க. பல முதல் தலைமுறை பெண் மாணவர்கள் இதை தவறவிடுகிறார்கள்!",
        apply_en: "Apply online: scholarship.tn.gov.in\n\nEligibility: Girl student in TN govt college\nDocuments: Aadhaar + Bank account + College admission proof\n\nApply within first month of joining college!",
        apply_ta: "ஆன்லைனில்: scholarship.tn.gov.in\n\nதகுதி: TN அரசு கல்லூரியில் படிக்கும் பெண் மாணவர்\nஆவணங்கள்: ஆதார் + வங்கி கணக்கு + கல்லூரி சேர்க்கை சான்றிதழ்" },
    ],
    applySteps: [
      { en: "For TNPSC/TRB Govt Jobs: Check the latest notification at tnpsc.gov.in for confirmed women quota percentage.", ta: "TNPSC/TRB அரசு வேலை: tnpsc.gov.in இல் புதிய அறிவிப்பை சரிபார்க்கவும் – உறுதியான பெண்கள் இட ஒதுக்கீடு சதவீதம் தெரிந்துகொள்ளவும்." },
      { en: "Apply online on TNPSC / TRB portal. Select your community category (SC/ST/BC/MBC/OC) AND mark gender as Female. Women quota is automatically applied.", ta: "TNPSC/TRB போர்டலில் ஆன்லைனில் விண்ணப்பிக்கவும். சமூக பிரிவு தேர்வு செய்யவும் மற்றும் பாலினம் பெண் என்று குறிக்கவும். பெண்கள் இட ஒதுக்கீடு தானாகவே பொருந்தும்." },
      { en: "For Moovalur Ramamirtham Scholarship (₹1,000/month): Apply at scholarship.tn.gov.in after joining govt college. Before September 30.", ta: "மூவலூர் ராமாமிர்தம் உதவித்தொகை (₹1,000/மாதம்): அரசு கல்லூரியில் சேர்ந்த பிறகு செப்டம்பர் 30 க்கு முன் scholarship.tn.gov.in இல் விண்ணப்பிக்கவும்." },
      { en: "Documents: Aadhaar Card + Community Certificate + Age Proof + Educational Certificates. Keep originals ready.", ta: "ஆவணங்கள்: ஆதார் அட்டை + சமூக சான்றிதழ் + வயது சான்று + கல்வி சான்றிதழ்கள். அசல் ஆவணங்கள் தயாராக வைக்கவும்." },
    ],
    offices: [
      { name: "TNPSC Portal", for_en: "Govt job applications – check each notification for women quota %", contact: "tnpsc.gov.in" },
      { name: "TRB Portal", for_en: "Teacher recruitment applications", contact: "trb.tn.gov.in" },
      { name: "TN Scholarship Portal", for_en: "Moovalur Ramamirtham Scholarship for girl students", contact: "scholarship.tn.gov.in" },
      { name: "Tahsildar Office", for_en: "Community Certificate, Age Proof – FREE", contact: "Nearest Taluk office | tnedistrict.tn.gov.in" },
    ],
    eligible: (d) => d.gender === "female" },

  { id: "sports", color: "#1a7a4a", icon: "🏅",
    title_en: "Sports Quota – 2–3%", title_ta: "விளையாட்டு இட ஒதுக்கீடு – 2–3%",
    percent: "2–3%", type: "Education",
    tnea_en: "✅ TNEA: 2–3% extra seats above normal community quota for verified District/State/National sports achievers",
    tnea_ta: "✅ TNEA: மாவட்ட/மாநில/தேசிய அளவில் சரிபார்க்கப்பட்ட விளையாட்டு சாதனையாளர்களுக்கு 2–3% கூடுதல் இடங்கள்",
    desc_en: "2–3% extra seats in engineering, arts & science and medical colleges for students with recognised sports achievements at District, State or National level. 30+ SAI-recognised sports are eligible.",
    desc_ta: "30+ SAI அங்கீகரிக்கப்பட்ட விளையாட்டுகளில் மாவட்ட, மாநில அல்லது தேசிய அளவில் சாதனை உள்ள மாணவர்களுக்கு 2–3% கூடுதல் இடங்கள்.",
    docs_en: ["⭐ Sports Achievement Certificate – Original from organiser (CRITICAL)", "⭐ Verified by District Sports Officer (DSO) – MANDATORY", "Community Certificate", "Transfer Certificate", "Medical Fitness Certificate – Govt hospital (mandatory)", "Aadhaar Card", "Mark sheets"],
    docs_ta: ["⭐ விளையாட்டு சாதனை சான்றிதழ் – போட்டி ஏற்பாட்டாளரிடம் அசல் (மிக முக்கியம்)", "⭐ மாவட்ட விளையாட்டு அதிகாரி (DSO) சரிபார்த்தது – கட்டாயம்", "சமூக சான்றிதழ்", "இட மாறு சான்றிதழ்", "மருத்துவ தகுதி சான்றிதழ் – அரசு மருத்துவமனை", "ஆதார் அட்டை", "மதிப்பெண் பட்டியல்"],
    schemes: [
      { en: "Sports Quota – Eligible Sports, Levels & How to Apply", ta: "விளையாட்டு இட ஒதுக்கீடு – விளையாட்டுகள், அளவுகள் & விண்ணப்பம்",
        amount: "2–3% extra seats in all TNEA colleges", deadline: "TNEA Sports Quota Counselling: June–July",
        desc_en: "✅ Eligible sports (30+ SAI recognised):\nCricket, Football, Volleyball, Basketball, Hockey, Boxing, Wrestling, Kabaddi, Kho-Kho, Swimming, Chess, Badminton, Table Tennis, Athletics, Cycling, Gymnastics, Shooting & all SAI sports\n\n🏆 Achievement levels:\n• National level: Participation is ENOUGH\n• State level: 1st, 2nd or 3rd place ONLY\n• District level: 1st place ONLY\n\n⚠️ Certificate must be within LAST 3 YEARS\n⚠️ Must be verified by District Sports Officer (DSO)",
        desc_ta: "✅ தகுதியான விளையாட்டுகள் (30+ SAI அங்கீகரிக்கப்பட்டவை):\nகிரிக்கெட், கால்பந்து, கூடைப்பந்து, கபடி, கோகோ, நீச்சல், சதுரங்கம், பேட்மிண்டன், அட்லெட்டிக்ஸ் & SAI அங்கீகரிக்கப்பட்ட 30+ விளையாட்டுகள்\n\n🏆 சாதனை அளவுகள்:\n• தேசிய அளவு: பங்கேற்பு போதும்\n• மாநில அளவு: 1, 2 அல்லது 3வது இடம் மட்டும்\n• மாவட்ட அளவு: 1வது இடம் மட்டும்\n\n⚠️ சான்றிதழ் கடந்த 3 ஆண்டுகளுக்குள் இருக்க வேண்டும்",
        apply_en: "Step 1: Participate in recognised tournament (District/State/National)\nStep 2: Get Sports Achievement Certificate from organiser\nStep 3: Get it VERIFIED by District Sports Officer (DSO) – mandatory\nStep 4: Get Medical Fitness Certificate from Govt hospital\nStep 5: Apply in TNEA sports quota at tneaonline.org during counselling\nStep 6: Attend sports trial at college if called\nStep 7: Submit ALL original documents at verification",
        apply_ta: "படி 1: அங்கீகரிக்கப்பட்ட போட்டியில் பங்கேற்கவும்\nபடி 2: போட்டி ஏற்பாட்டாளரிடம் சான்றிதழ் பெறுங்கள்\nபடி 3: மாவட்ட விளையாட்டு அதிகாரி (DSO) மூலம் சரிபார்க்கவும் – கட்டாயம்\nபடி 4: அரசு மருத்துவமனையில் மருத்துவ தகுதி சான்றிதழ் பெறுங்கள்\nபடி 5: tneaonline.org இல் விளையாட்டு இட ஒதுக்கீட்டில் விண்ணப்பிக்கவும்" },
    ],
    applySteps: [
      { en: "Participate in a recognised tournament at District / State / National level in any SAI-recognised sport.", ta: "SAI அங்கீகரிக்கப்பட்ட எந்த விளையாட்டிலும் மாவட்ட / மாநில / தேசிய அளவில் அங்கீகரிக்கப்பட்ட போட்டியில் பங்கேற்கவும்." },
      { en: "Get Sports Achievement Certificate from tournament organiser – keep the original safely.", ta: "போட்டி ஏற்பாட்டாளரிடம் விளையாட்டு சாதனை சான்றிதழ் பெறவும் – அசலை பாதுகாப்பாக வைக்கவும்." },
      { en: "Get certificate verified by District Sports Officer (DSO) – this is MANDATORY. Without DSO verification, certificate is not accepted.", ta: "மாவட்ட விளையாட்டு அதிகாரி (DSO) மூலம் சான்றிதழ் சரிபார்க்கவும் – இது கட்டாயம். DSO சரிபார்ப்பு இல்லாமல் சான்றிதழ் ஏற்கப்படாது." },
      { en: "Get Medical Fitness Certificate from a Government hospital – mandatory for sports quota.", ta: "அரசு மருத்துவமனையில் மருத்துவ தகுதி சான்றிதழ் பெறவும் – விளையாட்டு இட ஒதுக்கீட்டிற்கு கட்டாயம்." },
      { en: "For TNEA: Apply at tneaonline.org during counselling. Select Sports Quota section. Upload all certificates.", ta: "TNEA: கவுன்சிலிங் போது tneaonline.org இல் விண்ணப்பிக்கவும். Sports Quota பிரிவு தேர்வு செய்யவும். சான்றிதழ்கள் பதிவேற்றவும்." },
      { en: "Attend sports trial at college if called. Bring ALL original certificates for final document verification.", ta: "கல்லூரி அழைத்தால் விளையாட்டு சோதனையில் கலந்துகொள்ளவும். இறுதி ஆவண சரிபார்ப்பிற்கு அனைத்து அசல் சான்றிதழ்களும் கொண்டு வரவும்." },
    ],
    offices: [
      { name: "District Sports Office", for_en: "DSO certificate verification – MANDATORY for sports quota", contact: "District Sports Office at your district headquarters" },
      { name: "Government Hospital", for_en: "Medical Fitness Certificate – mandatory", contact: "Nearest Government hospital" },
      { name: "Tahsildar Office", for_en: "Community Certificate – FREE", contact: "Nearest Taluk office | tnedistrict.tn.gov.in" },
      { name: "TNEA Portal", for_en: "Sports quota engineering admission", contact: "tneaonline.org (open May–July)" },
    ],
    eligible: (d) => d.sports },
];

const T = {
  en: { appName:"URIMAI",sub:"Know Your Rights",chooseLang:"Choose Your Language",enterMobile:"Enter Mobile Number",mobilePh:"10-digit number",sendOTP:"Send OTP",enterOTP:"OTP sent to",verify:"Verify & Continue",home_hi:"Hello! 👋",home_sub:"Discover TN reservations & scholarships you qualify for",checkElig:"Check My Eligibility",checkEligSub:"5 questions → All your reservations & schemes",allRes:"All Reservations & Schemes",allResSub:"Browse, filter & explore",tnpscT:"TNPSC Eligibility",upscT:"UPSC Eligibility",tneaT:"TNEA Seat Breakdown",back:"← Back",yourBenefits:"Your Reservations 🎉",docs:"Documents Needed",schemes:"Schemes & Scholarships",noMatch:"No specific reservation found. You may apply under Open Category (OC).",q1:"Your community?",q2:"School type?",q3:"Annual family income?",q4:"Gender?",q5:"Age group?",govt:"Government School",pvt:"Private School",male:"Male",female:"Female",inc1:"Below ₹1 Lakh",inc2:"₹1L–₹2.5L",inc3:"₹2.5L–₹8L",inc4:"Above ₹8L",cats:["SC (Scheduled Caste)","ST (Scheduled Tribe)","BC (Backward Class)","MBC / DNC","EWS (General – Low Income)"],ages:["Below 18","18–30","31–45","Above 45"],exSvc:"Ex-Serviceman Family",diffAbled:"Differently Abled",sportsQ:"Sports Achievement",savedRes:"Saved",notifT:"Notifications",searchPh:"Search reservations & schemes...",noRes:"No results found",chatPh:"Ask about any reservation...",chatWel:"Hi! I'm URIMAI AI 🤖\n\nI know everything about TN reservations!\n\n• SC/ST/BC/MBC/EWS details?\n• TNEA verified seat %?\n• 7.5% Govt School quota?\n• TNPSC/UPSC age benefits?\n• Scholarships & documents?",navHome:"Home",navSchemes:"Schemes",navExam:"Exams",navProfile:"Profile",navChat:"AI",save:"Save",saved:"Saved ✓",fAll:"All",fEdu:"Education",fJob:"Jobs",qTitle:"Raise a Query",qName:"Your Name",qMob:"Mobile Number",qMsg:"Your Query",qSubmit:"Submit",qSent:"✅ Query submitted! We will contact you within 24 hours.",care:"Customer Care",n1:"📚 Scholarship Deadline",n1s:"SC/ST/BC/MBC – Apply by Sep 30 at scholarships.gov.in!",n2:"🏫 7.5% Quota",n2s:"TNEA 2025 registration open at tneaonline.org",n3:"🏛️ TNPSC",n3s:"SC/ST get FREE exam + 5 extra years age relaxation!",share:"📤 Share via WhatsApp",amt:"💰 Amount",dl:"⏰ Deadline",yourCat:"Select your category:",verified:"✅ Verified – Official DoTE / tneaonline.org data",ageL:"Age Limit",fee:"Exam Fee",att:"Attempts",stages:"Exam Stages",posts:"Posts",tips:"Category Benefits" },
  ta: { appName:"உரிமை",sub:"உங்கள் உரிமை அறியுங்கள்",chooseLang:"மொழியை தேர்வு செய்யுங்கள்",enterMobile:"மொபைல் எண் உள்ளிடுக",mobilePh:"10 இலக்க எண்",sendOTP:"OTP அனுப்பு",enterOTP:"OTP அனுப்பப்பட்டது",verify:"சரிபார்த்து தொடரவும்",home_hi:"வணக்கம்! 👋",home_sub:"தமிழ்நாட்டில் உங்களுக்கு உரிய இட ஒதுக்கீடுகளும் உதவித்தொகைகளும்",checkElig:"என் தகுதி பார்க்க",checkEligSub:"5 கேள்விகள் → உங்கள் இட ஒதுக்கீடுகள் & திட்டங்கள்",allRes:"அனைத்து இட ஒதுக்கீடுகள் & திட்டங்கள்",allResSub:"வடிகட்டி & விவரமாக பார்க்கவும்",tnpscT:"TNPSC தகுதி",upscT:"UPSC தகுதி",tneaT:"TNEA இட பகிர்வு விவரம்",back:"← திரும்பு",yourBenefits:"உங்கள் இட ஒதுக்கீடுகள் 🎉",docs:"தேவையான ஆவணங்கள்",schemes:"திட்டங்கள் & உதவித்தொகைகள்",noMatch:"உங்கள் விவரங்களுக்கு குறிப்பிட்ட இட ஒதுக்கீடு இல்லை. OC பிரிவில் விண்ணப்பிக்கலாம்.",q1:"உங்கள் சமூகம்?",q2:"பள்ளி வகை?",q3:"குடும்ப வருட வருமானம்?",q4:"பாலினம்?",q5:"வயது?",govt:"அரசு பள்ளி",pvt:"தனியார் பள்ளி",male:"ஆண்",female:"பெண்",inc1:"₹1 லட்சத்திற்கு கீழ்",inc2:"₹1L–₹2.5L",inc3:"₹2.5L–₹8L",inc4:"₹8 லட்சத்திற்கு மேல்",cats:["SC (தாழ்த்தப்பட்டோர்)","ST (பழங்குடியினர்)","BC (பிற்படுத்தப்பட்டோர்)","MBC / DNC","EWS (பொது – ஏழை)"],ages:["18 வயதிற்கு கீழ்","18–30","31–45","45 வயதிற்கு மேல்"],exSvc:"முன்னாள் இராணுவ குடும்பம்",diffAbled:"மாற்றுத்திறனாளி",sportsQ:"விளையாட்டு சாதனை",savedRes:"சேமித்தவை",notifT:"அறிவிப்புகள்",searchPh:"இட ஒதுக்கீடு & திட்டங்கள் தேடவும்...",noRes:"முடிவுகள் இல்லை",chatPh:"இட ஒதுக்கீடு பற்றி கேளுங்கள்...",chatWel:"வணக்கம்! நான் URIMAI AI 🤖\n\nதமிழ்நாடு இட ஒதுக்கீடு அனைத்தும் தெரியும்!\n\n• SC/ST/BC/MBC/EWS விவரங்கள்?\n• TNEA சரிபார்க்கப்பட்ட இட சதவீதம்?\n• 7.5% அரசு பள்ளி இட ஒதுக்கீடு?\n• TNPSC/UPSC வயது சலுகைகள்?\n• உதவித்தொகைகள் & ஆவணங்கள்?",navHome:"முகப்பு",navSchemes:"திட்டங்கள்",navExam:"தேர்வு",navProfile:"சுயவிவரம்",navChat:"AI",save:"சேமி",saved:"சேமிக்கப்பட்டது ✓",fAll:"அனைத்தும்",fEdu:"கல்வி",fJob:"வேலை",qTitle:"கேள்வி / புகார்",qName:"உங்கள் பெயர்",qMob:"மொபைல் எண்",qMsg:"உங்கள் கேள்வி",qSubmit:"சமர்பி",qSent:"✅ கேள்வி சமர்பிக்கப்பட்டது! 24 மணி நேரத்தில் தொடர்பு கொள்வோம்.",care:"வாடிக்கையாளர் சேவை",n1:"📚 உதவித்தொகை கடைசி தேதி",n1s:"SC/ST/BC/MBC – செப்டம்பர் 30 க்கு முன் scholarships.gov.in இல்!",n2:"🏫 7.5% இட ஒதுக்கீடு",n2s:"TNEA 2025 பதிவு tneaonline.org இல் தொடங்கியுள்ளது",n3:"🏛️ TNPSC",n3s:"SC/ST-க்கு இலவச தேர்வு + 5 கூடுதல் வயது சலுகை!",share:"📤 WhatsApp-ல் பகிர்",amt:"💰 தொகை",dl:"⏰ கடைசி தேதி",yourCat:"உங்கள் பிரிவை தேர்வு செய்யுங்கள்:",verified:"✅ சரிபார்க்கப்பட்டது – அதிகாரப்பூர்வ DoTE / tneaonline.org தரவு",ageL:"வயது வரம்பு",fee:"தேர்வு கட்டணம்",att:"முயற்சிகள்",stages:"தேர்வு நிலைகள்",posts:"பதவிகள்",tips:"பிரிவு சலுகைகள்" }
};

const KB = {
  sc: { en: `🔵 SC/ST Reservation (Verified)\n\nTNEA Official: SC=15%, SCA=3%, ST=1%\nGovt Jobs: Same percentages\n\n💰 Key Schemes:\n• Post-Matric Scholarship: ₹3,500–₹12,000/yr → scholarships.gov.in (apply by Sep 30!)\n• Free education up to PG in all TN govt colleges\n• Free hostel in govt hostels (apply before June 30)\n• Dr. Ambedkar Fellowship: ₹25,000–₹28,000/month for research\n\nDocuments: Community Certificate + Income + Nativity + Aadhaar (all from Tahsildar – FREE)`, ta: `🔵 SC/ST இட ஒதுக்கீடு (சரிபார்க்கப்பட்டது)\n\nTNEA: SC=15%, SCA=3%, ST=1%\n\n💰 முக்கிய திட்டங்கள்:\n• மேல்நிலை பின் உதவித்தொகை: ₹3,500–₹12,000 → scholarships.gov.in (செப்டம்பர் 30 கடைசி!)\n• PG வரை இலவச கல்வி – அரசு கல்லூரிகள்\n• இலவச விடுதி – ஜூன் 30 க்கு முன் விண்ணப்பிக்கவும்\n• அம்பேத்கர் ஃபெலோஷிப்: ₹25,000–₹28,000/மாதம்` },
  bc: { en: `🔷 BC Reservation (Verified)\n\nTNEA Official: BC=26.5%, BCM=3.5%\nGovt Jobs: 26.5% in all recruitments\n\n💰 Key Schemes:\n• Post-Matric Scholarship: ₹2,000–₹8,000/yr → scholarships.gov.in (apply by Sep 30!)\n• FREE coaching for TNPSC/UPSC at District BC Welfare Office\n• Self-employment loan up to ₹1 Lakh\n\nDocuments: BC Certificate + Nativity + Income + Aadhaar (Tahsildar – FREE)`, ta: `🔷 BC இட ஒதுக்கீடு (சரிபார்க்கப்பட்டது)\n\nTNEA: BC=26.5%, BCM=3.5%\n\n💰 திட்டங்கள்:\n• மேல்நிலை பின் உதவித்தொகை → scholarships.gov.in (செப்டம்பர் 30!)\n• TNPSC/UPSC இலவச பயிற்சி – மாவட்ட BC நல அதிகாரி\n• சுய தொழில் கடன் ₹1 லட்சம் வரை` },
  mbc: { en: `🟣 MBC/DNC Reservation (Verified)\n\nTNEA Official: MBC & DNC = 20%\nGovt Jobs: 20% in all recruitments\n\n💰 Key Schemes:\n• Post-Matric Scholarship: ₹2,000–₹8,000/yr → scholarships.gov.in\n• FREE coaching for TNPSC/UPSC at District MBC Welfare Office\n• Self-employment loan up to ₹75,000`, ta: `🟣 MBC/DNC இட ஒதுக்கீடு (சரிபார்க்கப்பட்டது)\n\nTNEA: MBC & DNC = 20%\n\n💰 திட்டங்கள்:\n• மேல்நிலை பின் உதவித்தொகை → scholarships.gov.in\n• TNPSC/UPSC இலவச பயிற்சி – மாவட்ட MBC நல அதிகாரி\n• சுய தொழில் கடன் ₹75,000 வரை` },
  tnea: { en: `📊 TNEA Verified Seat Percentages (Official DoTE):\n\n• OC: 26.5%  • BC: 26.5%\n• BCM: 3.5%  • MBC & DNC: 20%\n• SC: 15%    • SCA: 3%  • ST: 1%\n• 7.5% Govt School: within each category\n\nFormula: Cutoff = Maths + (Physics+Chemistry)/2 | Max=200\nMin marks: OC=45% | All reserved=40% in PCM\n\nApply: tneaonline.org (May–June each year)`, ta: `📊 TNEA சரிபார்க்கப்பட்ட இட சதவீதங்கள் (DoTE அதிகாரப்பூர்வ):\n\n• OC: 26.5%  • BC: 26.5%\n• BCM: 3.5%  • MBC & DNC: 20%\n• SC: 15%    • SCA: 3%  • ST: 1%\n• 7.5% அரசு பள்ளி: ஒவ்வொரு பிரிவிற்குள்\n\nவிண்ணப்பம்: tneaonline.org` },
  q75: { en: `🏫 7.5% Govt School Quota (Verified)\n\n✅ Eligibility:\n• Studied Std 6–12 ENTIRELY in TN Govt school\n• Even ONE year in private school = NOT eligible\n• Must be TN native\n• Applies within each community category\n\n🎓 Where it applies: TNEA Engineering + NEET TN Medical + Polytechnic\n\n📄 Critical document: Govt School Study Certificate (Std 6–12) from school headmaster\n\n⭐ HUGE advantage – your competition is only other govt school students in your category!`, ta: `🏫 7.5% அரசு பள்ளி இட ஒதுக்கீடு (சரிபார்க்கப்பட்டது)\n\n✅ தகுதி:\n• 6–12 வரை முழுவதும் TN அரசு பள்ளி மட்டும்\n• ஒரு வருடம் தனியார் = தகுதி இல்லை\n• TN சொந்தகாரராக இருக்க வேண்டும்\n\n📄 முக்கிய ஆவணம்: அரசு பள்ளி படிப்பு சான்றிதழ் (6–12) – பள்ளி தலைமை ஆசிரியர்` },
  women: { en: `👩 Women Reservation (Fact-checked)\n\n⚠️ Correct info:\n• TN ANNOUNCED increase 30% → 40% in Sept 2021\n• Applies to TNPSC & TRB govt jobs ONLY\n• NO separate women quota in TNEA engineering\n• Women compete within own community category in TNEA\n• Always verify exact % at tnpsc.gov.in before applying\n\n💰 Education scheme: Moovalur Ramamirtham scholarship ₹1,000/month for girl students in govt colleges`, ta: `👩 பெண்கள் இட ஒதுக்கீடு (சரிபார்க்கப்பட்டது)\n\n⚠️ சரியான தகவல்:\n• TN செப்டம்பர் 2021-ல் 30% → 40% அறிவிப்பு\n• TNPSC & TRB அரசு வேலைகளுக்கு மட்டும்\n• TNEA-ல் தனி பெண்கள் இட ஒதுக்கீடு இல்லை\n• tnpsc.gov.in இல் ஒவ்வொரு அறிவிப்பும் சரிபார்க்கவும்` },
  tnpsc: { en: `🏛️ TNPSC Reservation Benefits:\n\n• SC/ST: FREE exam (₹0) + Age limit 37 + NO attempt limit\n• BC/MBC: 3 extra years (max age 35)\n• EWS: 3 extra years + 10% posts reserved\n• OC: Age 32, pay normal fee\n\nGroups:\n• Group 1: Deputy Collector, DSP (Degree, Interview)\n• Group 2A: Junior Assistant (Degree, NO interview)\n• Group 4: VAO (HSC, NO interview)\n\nCheck full details in Exams tab!`, ta: `🏛️ TNPSC இட ஒதுக்கீடு சலுகைகள்:\n\n• SC/ST: இலவச தேர்வு + வயது 37 + வரம்பற்ற முயற்சிகள்\n• BC/MBC: 3 கூடுதல் வயது (35 வரை)\n• OC: 32 வயது, கட்டணம் செலுத்தவும்\n\nExams tab-ல் முழு விவரம்!` },
  upsc: { en: `🇮🇳 UPSC Reservation Benefits (Verified):\n\n• SC/ST: +5 years + UNLIMITED attempts – biggest UPSC advantage!\n• OBC/BC: +3 years + 9 attempts (OC gets only 6)\n• OC: Max 32 yrs, 6 attempts\n• Women: FREE application (all categories)\n• PH: +10 years age relaxation\n\nIAS/IPS/IFS → Civil Services Exam (UPSC)\nBSF/CRPF/CISF → CAPF Exam (UPSC)\n\nCheck UPSC tab for full details!`, ta: `🇮🇳 UPSC இட ஒதுக்கீடு சலுகைகள் (சரிபார்க்கப்பட்டது):\n\n• SC/ST: +5 வயது + வரம்பற்ற முயற்சிகள் – மிகப்பெரிய UPSC சலுகை!\n• OBC/BC: +3 வயது + 9 முயற்சிகள்\n• OC: 32 வயது வரை, 6 முயற்சிகள்\n• பெண்கள்: இலவச விண்ணப்பம்` },
  docs: { en: `📄 Common Documents (ALL from Tahsildar – FREE):\n\n1. Community Certificate (7–15 working days)\n2. Nativity Certificate\n3. Income Certificate\n4. Aadhaar Card\n5. Ration Card\n6. Transfer Certificate (from school)\n7. Mark sheets (10th & 12th)\n8. Passport photos (4 nos)\n\n🌐 Apply online: tnedistrict.tn.gov.in\n📍 OR visit nearest Tahsildar office\n⏱ Time: 7–15 working days | FREE`, ta: `📄 பொதுவான ஆவணங்கள் (அனைத்தும் தாலுக்கா – இலவசம்):\n\n1. சமூக சான்றிதழ் (7–15 நாட்கள்)\n2. தாய்நாடு சான்றிதழ்\n3. வருமான சான்றிதழ்\n4. ஆதார் அட்டை\n5. ரேஷன் அட்டை\n6. இட மாறு சான்றிதழ்\n7. மதிப்பெண் பட்டியல்\n\n🌐 tnedistrict.tn.gov.in – இலவசம், 7–15 நாட்கள்` },
  default: { en: `🤖 I can help with:\n• SC/ST/BC/MBC/EWS reservation (fact-checked)\n• TNEA verified seat percentages\n• 7.5% Govt School quota\n• Women reservation (corrected info)\n• Sports quota\n• TNPSC age & fee benefits\n• UPSC age relaxation & attempts\n• Scholarships at scholarships.gov.in\n• Documents from Tahsildar\nJust ask! 😊`, ta: `🤖 நான் இவை பற்றி பதிலளிக்கலாம்:\n• SC/ST/BC/MBC/EWS இட ஒதுக்கீடு\n• TNEA சரிபார்க்கப்பட்ட இட சதவீதங்கள்\n• 7.5% அரசு பள்ளி இட ஒதுக்கீடு\n• TNPSC/UPSC சலுகைகள்\n• உதவித்தொகைகள் & ஆவணங்கள்` },
};

function botReply(i, l) {
  const q = i.toLowerCase(); const L = l || "en";
  if ((q.includes("sc") && !q.includes("mbc") && !q.includes("bc")) || q.includes("scheduled caste") || q.includes("தாழ்த்தப்பட்ட")) return KB.sc[L];
  if (q.includes("mbc") || q.includes("most backward") || q.includes("மிகவும் பிற்படுத்த")) return KB.mbc[L];
  if ((q.includes("bc") || q.includes("backward")) && !q.includes("mbc")) return KB.bc[L];
  if (q.includes("tnea") || q.includes("seat %") || q.includes("இட சதவீத")) return KB.tnea[L];
  if (q.includes("7.5") || q.includes("govt school") || q.includes("அரசு பள்ளி")) return KB.q75[L];
  if (q.includes("women") || q.includes("female") || q.includes("பெண்")) return KB.women[L];
  if (q.includes("tnpsc") || q.includes("group") || q.includes("குழு")) return KB.tnpsc[L];
  if (q.includes("upsc") || q.includes("ias") || q.includes("ips")) return KB.upsc[L];
  if (q.includes("document") || q.includes("certificate") || q.includes("ஆவணம்") || q.includes("சான்றிதழ்")) return KB.docs[L];
  return KB.default[L];
}

const S = {
  app: { minHeight: "100vh", background: "linear-gradient(150deg,#fff5f0 0%,#fff0f8 100%)", fontFamily: "'Noto Sans Tamil','DM Sans',sans-serif", display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: "72px" },
  wrap: { width: "100%", maxWidth: "420px" },
  card: { background: "#fff", borderRadius: "22px", padding: "22px 18px", margin: "14px", boxShadow: "0 6px 36px rgba(192,57,43,0.09)", display: "flex", flexDirection: "column", gap: "14px" },
  scrl: { background: "#fff", borderRadius: "22px", padding: "18px 16px", margin: "14px", boxShadow: "0 6px 36px rgba(192,57,43,0.09)", display: "flex", flexDirection: "column", gap: "12px", maxHeight: "calc(100vh - 100px)", overflowY: "auto" },
  logo: (sz) => ({ fontSize: sz + "px", fontWeight: "900", color: RED, letterSpacing: "2px", lineHeight: 1, textAlign: "center" }),
  logoSub: { fontSize: "11px", color: "#bbb", marginTop: "3px", textAlign: "center" },
  title: { fontSize: "17px", fontWeight: "800", color: DARK },
  row: { display: "flex", gap: "10px" },
  langBtn: (a) => ({ flex: 1, padding: "16px 8px", borderRadius: "13px", border: `2px solid ${a ? RED : "#eee"}`, background: a ? "#fff5f5" : "#fafafa", cursor: "pointer", fontSize: "15px", fontWeight: "800", color: a ? RED : "#555", fontFamily: "inherit" }),
  inp: { width: "100%", padding: "13px 14px", borderRadius: "12px", border: "2px solid #eee", fontSize: "15px", outline: "none", fontFamily: "inherit", background: "#fafafa", boxSizing: "border-box" },
  prefix: { padding: "13px 12px", background: "#fafafa", border: "2px solid #eee", borderRadius: "12px", fontWeight: "700", color: "#333", whiteSpace: "nowrap" },
  btn: (a = true, sm = false) => ({ width: sm ? "auto" : "100%", padding: sm ? "7px 14px" : "14px", borderRadius: "12px", background: a ? RED : "#ddd", color: a ? "#fff" : "#aaa", fontWeight: "800", fontSize: sm ? "12px" : "15px", border: "none", cursor: a ? "pointer" : "not-allowed", fontFamily: "inherit" }),
  optBtn: (sel) => ({ width: "100%", padding: "13px 14px", borderRadius: "11px", border: `2px solid ${sel ? RED : "#eee"}`, background: sel ? "#fff5f5" : "#fafafa", cursor: "pointer", fontSize: "14px", fontWeight: "600", color: sel ? RED : "#333", textAlign: "left", fontFamily: "inherit", marginBottom: "8px" }),
  homeBtn: (bg) => ({ padding: "17px", borderRadius: "15px", background: bg, color: "#fff", border: "none", cursor: "pointer", textAlign: "left", width: "100%", fontFamily: "inherit" }),
  hBtnT: { fontSize: "15px", fontWeight: "800", marginBottom: "3px" },
  hBtnS: { fontSize: "12px", opacity: .85 },
  back: { background: "none", border: "none", color: RED, fontWeight: "700", fontSize: "13px", cursor: "pointer", fontFamily: "inherit", padding: 0 },
  prog: { height: "5px", background: "#eee", borderRadius: "10px", overflow: "hidden" },
  progFill: (p) => ({ height: "100%", width: `${p}%`, background: `linear-gradient(90deg,${RED},#e74c3c)`, borderRadius: "10px", transition: "width .4s" }),
  badge: (c) => ({ background: c, color: "#fff", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap" }),
  tag: { background: "#f0f0f0", borderRadius: "6px", padding: "2px 8px", fontSize: "10px", fontWeight: "700", color: "#777", display: "inline-block" },
  sec: (c) => ({ borderRadius: "13px", border: `2px solid ${c}20`, background: `${c}06`, padding: "14px", marginBottom: "10px" }),
  secT: (c) => ({ fontSize: "13px", fontWeight: "800", color: c, marginBottom: "8px" }),
  schCard: (c) => ({ borderRadius: "12px", border: `2px solid ${c}20`, background: "#fff", padding: "13px", marginBottom: "10px", cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }),
  fBtn: (a) => ({ padding: "6px 13px", borderRadius: "18px", background: a ? RED : "#f5f5f5", color: a ? "#fff" : "#666", border: `1.5px solid ${a ? RED : "#eee"}`, fontSize: "11px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }),
  sbar: { display: "flex", alignItems: "center", gap: "9px", background: "#fafafa", border: "2px solid #eee", borderRadius: "12px", padding: "11px 13px" },
  sinp: { flex: 1, border: "none", outline: "none", background: "transparent", fontSize: "13px", fontFamily: "inherit" },
  nCard: { borderRadius: "12px", border: "2px solid #fff0e8", background: "#fff8f5", padding: "12px 14px", marginBottom: "10px", display: "flex", gap: "10px" },
  pSec: { borderRadius: "12px", border: "2px solid #f5e8e8", padding: "13px", display: "flex", flexDirection: "column", gap: "8px" },
  pRow: { display: "flex", justifyContent: "space-between", fontSize: "13px" },
  bub: (u) => ({ maxWidth: "85%", padding: "10px 14px", borderRadius: u ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: u ? RED : "#f5f5f5", color: u ? "#fff" : DARK, fontSize: "13px", lineHeight: 1.6, alignSelf: u ? "flex-end" : "flex-start", whiteSpace: "pre-wrap" }),
  cRow: { display: "flex", gap: "8px", paddingTop: "8px" },
  cInp: { flex: 1, padding: "11px 14px", borderRadius: "12px", border: "2px solid #eee", fontSize: "13px", outline: "none", fontFamily: "inherit", background: "#fafafa" },
  sBtn: { padding: "11px 15px", borderRadius: "12px", background: RED, color: "#fff", border: "none", cursor: "pointer", fontWeight: "800", fontSize: "16px" },
  qBtns: { display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "4px" },
  qBtn: { padding: "5px 10px", borderRadius: "16px", background: "#fff5f5", border: `1.5px solid ${RED}30`, color: RED, fontSize: "11px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" },
  dot: { display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#aaa", margin: "0 2px", animation: "bounce 1s infinite" },
  navbar: { position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1.5px solid #f0e0e0", display: "flex", justifyContent: "space-around", padding: "9px 0 12px", boxShadow: "0 -4px 20px rgba(0,0,0,0.07)", zIndex: 100 },
  navItem: (a) => ({ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", cursor: "pointer", padding: "3px 10px", borderRadius: "10px", background: a ? "#fff5f5" : "transparent" }),
  navLbl: (a) => ({ fontSize: "10px", fontWeight: a ? "800" : "500", color: a ? RED : "#aaa" }),
  resBox: (ok) => ({ borderRadius: "13px", background: ok ? "#efffef" : "#fff5f5", border: `2px solid ${ok ? "#1a6b3c" : RED}30`, padding: "16px", textAlign: "center" }),
  cBtn: (c) => ({ display: "flex", alignItems: "center", gap: "12px", padding: "15px", borderRadius: "13px", background: c, color: "#fff", border: "none", cursor: "pointer", width: "100%", fontFamily: "inherit", marginBottom: "9px" }),
  hint: { textAlign: "center", fontSize: "11px", color: "#bbb" },
  cPill: (a, c) => ({ padding: "7px 12px", borderRadius: "18px", background: a ? c : "#f5f5f5", color: a ? "#fff" : "#666", border: `2px solid ${a ? c : "#eee"}`, fontWeight: "700", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", margin: "0 4px 6px 0" }),
  tRow: { display: "flex", justifyContent: "space-between", padding: "9px 12px", borderRadius: "8px", marginBottom: "4px", alignItems: "center", background: "#fafafa" },
  vBadge: { fontSize: "11px", color: "#1a6b3c", fontWeight: "700", background: "#efffef", borderRadius: "8px", padding: "3px 9px", display: "inline-block", marginBottom: "8px" },
  warn: { borderRadius: "10px", background: "#fff8e8", border: "1.5px solid #f5c842", padding: "10px 13px", fontSize: "12px", color: "#7a5c00", lineHeight: 1.6 },
  shareBtn: { width: "100%", padding: "13px", borderRadius: "12px", background: "#25D366", color: "#fff", fontWeight: "800", fontSize: "14px", border: "none", cursor: "pointer", fontFamily: "inherit" },
  fab: { position: "fixed", bottom: "80px", right: "16px", width: "46px", height: "46px", borderRadius: "50%", background: "#1a7a4a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.2)", zIndex: 99, border: "none" },
  sRow: { display: "flex", gap: "10px", marginBottom: "10px", alignItems: "flex-start" },
  sNum: (c) => ({ width: "22px", height: "22px", borderRadius: "50%", background: c, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "800", flexShrink: 0 }),
  checkRow: { display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "10px", marginBottom: "6px", cursor: "pointer" },
};

export default function App() {
  const [lang, setLang] = useState(null);
  const [screen, setScreen] = useState("lang");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(0);
  const [uD, setUD] = useState({ category: "", school: "", income: "", gender: "", age: "", exService: false, differently_abled: false, sports: false });
  const [results, setResults] = useState([]);
  const [saved, setSaved] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [sq, setSq] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [msgs, setMsgs] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [query, setQuery] = useState({ name: "", mob: "", msg: "" });
  const [querySent, setQuerySent] = useState(false);
  const [detailRes, setDetailRes] = useState(null);
  const [selScheme, setSelScheme] = useState(null);
  const [checkedDocs, setCheckedDocs] = useState({});
  const [detailTab, setDetailTab] = useState("schemes");
  const [tnpscGrp, setTnpscGrp] = useState(null);
  const [tnpscCat, setTnpscCat] = useState("SC");
  const [upscEx, setUpscEx] = useState(null);
  const [upscCat, setUpscCat] = useState("SC");
  const [examMode, setExamMode] = useState("tnpsc");
  const [showCalc, setShowCalc] = useState(false);
  const [tneaM, setTneaM] = useState({ maths: "", physics: "", chemistry: "", cat: "SC" });
  const [tneaRes, setTneaRes] = useState(null);
  const [neetM, setNeetM] = useState({ score: "", cat: "SC" });
  const [neetRes, setNeetRes] = useState(null);
  const [calcMode, setCalcMode] = useState("tnea");
  const chatEnd = useRef(null);
  const t = lang ? T[lang] : T.en;

  useEffect(() => { if (screen === "main" && msgs.length === 0) setMsgs([{ u: false, text: t.chatWel }]); }, [screen]);
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

  useEffect(() => {
    const token = getToken();
    if (token) {
      api.getProfile().then(data => {
        if (data.user) {
          setMobile(data.user.phone);
          if (data.profile) {
            setUD({
              category: data.profile.category || "",
              school: data.profile.school || "",
              income: data.profile.income || "",
              gender: data.profile.gender || "",
              age: data.profile.age || "",
              exService: !!data.profile.ex_service,
              differently_abled: !!data.profile.differently_abled,
              sports: !!data.profile.sports,
            });
          }
          if (data.savedReservations) {
            setSaved(RESERVATIONS.filter(r => data.savedReservations.includes(r.id)));
          }
        }
      }).catch(() => { clearToken(); });
    }
  }, []);

  const Qs = [
    { key: "category", q: t.q1, opts: t.cats },
    { key: "school", q: t.q2, opts: [t.govt, t.pvt], vals: ["govt", "pvt"] },
    { key: "income", q: t.q3, opts: [t.inc1, t.inc2, t.inc3, t.inc4] },
    { key: "gender", q: t.q4, opts: [t.male, t.female], vals: ["male", "female"] },
    { key: "age", q: t.q5, opts: t.ages },
  ];

  const handleOpt = (key, display, raw) => {
    const nd = { ...uD, [key]: raw ?? display }; setUD(nd);
    if (step < Qs.length - 1) setStep(step + 1);
    else {
      const matched = RESERVATIONS.filter(r => r.eligible(nd));
      setResults(matched); setIsSaved(false); setScreen("results");
      if (getToken()) { api.saveEligibility(nd).catch(() => {}); }
    }
  };

  const sendChat = (text) => {
    const msg = text || chatInput.trim(); if (!msg) return;
    setChatInput(""); setMsgs(p => [...p, { u: true, text: msg }]); setTyping(true);
    setTimeout(() => { setMsgs(p => [...p, { u: false, text: botReply(msg, lang) }]); setTyping(false); }, 700);
  };

  const calcTnea = () => {
    const m = parseFloat(tneaM.maths) || 0, p = parseFloat(tneaM.physics) || 0, c = parseFloat(tneaM.chemistry) || 0;
    const co = (m + p / 2 + c / 2).toFixed(2);
    setTneaRes({ co, eligible: (p + c) >= (tneaM.cat === "OC" ? 45 : 40) });
  };
  const calcNeet = () => { const s = parseInt(neetM.score) || 0; setNeetRes({ s, eligible: s >= 300 }); };

  const openDetail = (r) => { setDetailRes(r); setCheckedDocs({}); setSelScheme(null); setDetailTab("schemes"); setScreen("detail"); };
  const shareResults = () => { const n = results.map(r => lang === "ta" ? r.title_ta : r.title_en).join(", "); window.open(`https://wa.me/?text=${encodeURIComponent(`I qualify for these TN reservations:\n${n}\n\nCheck YOUR eligibility at URIMAI app!`)}`); };

  const filteredRes = RESERVATIONS.filter(r => {
    const title = lang === "ta" ? r.title_ta : r.title_en;
    return title.toLowerCase().includes(sq.toLowerCase()) && (typeFilter === "All" || r.type.includes(typeFilter));
  });

  const cc = { OC: "#555", BC: "#1a4e8b", "OBC/BC": "#1a4e8b", MBC: "#7b2d8b", SC: "#1a6b3c", ST: "#1a6b3c", EWS: "#8b6914", PH: "#2d6b6b" };

  // CALCULATOR MODAL
  if (showCalc) return (
    <div style={S.app}><div style={S.wrap}><div style={S.scrl}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={S.title}>📐 Cutoff Calculator</div>
        <button style={S.btn(false, true)} onClick={() => setShowCalc(false)}>✕ Close</button>
      </div>
      <div style={S.vBadge}>{t.verified}</div>
      <div style={S.row}>
        <button style={S.fBtn(calcMode === "tnea")} onClick={() => { setCalcMode("tnea"); setTneaRes(null); }}>TNEA Engineering</button>
        <button style={S.fBtn(calcMode === "neet")} onClick={() => { setCalcMode("neet"); setNeetRes(null); }}>NEET Medical</button>
      </div>
      {calcMode === "tnea" && (<>
        <div style={{ ...S.warn, background: "#f0f8ff", border: "1.5px solid #1a4e8b30", color: "#1a4e8b" }}>📐 Cutoff = Maths + (Physics+Chemistry)/2 | Max=200<br />Min marks: OC=45% | All reserved categories=40% in PCM combined</div>
        <div style={{ fontSize: "12px", color: "#666", fontWeight: "700", marginBottom: "6px" }}>{t.yourCat}</div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
          {["OC", "BC", "MBC", "SC", "ST", "EWS"].map(c => <button key={c} style={S.fBtn(tneaM.cat === c)} onClick={() => setTneaM(p => ({ ...p, cat: c }))}>{c}</button>)}
        </div>
        {[["maths", "Maths (out of 100)"], ["physics", "Physics (out of 100)"], ["chemistry", "Chemistry (out of 100)"]].map(([key, label]) => (
          <div key={key}><div style={{ fontSize: "12px", color: "#666", fontWeight: "700", marginBottom: "4px" }}>{label}</div>
            <input style={S.inp} type="number" min="0" max="100" placeholder="0–100" value={tneaM[key]} onChange={e => setTneaM(p => ({ ...p, [key]: e.target.value }))} /></div>
        ))}
        <button style={S.btn()} onClick={calcTnea}>Calculate My TNEA Cutoff</button>
        {tneaRes && (<div style={S.resBox(tneaRes.eligible)}>
          <div style={{ fontSize: "44px", fontWeight: "900", color: "#1a6b3c" }}>{tneaRes.co}</div>
          <div style={{ fontSize: "13px", fontWeight: "700", color: tneaRes.eligible ? "#1a6b3c" : RED, marginTop: "6px" }}>{tneaRes.eligible ? "✅ Meets minimum marks" : "❌ Check minimum marks"}</div>
          <div style={{ fontSize: "11px", color: "#555", marginTop: "10px" }}>
            {TNEA_SEATS.slice(0, 7).map((c, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid #eee" }}>
                <span style={{ fontWeight: "700", color: c.color }}>{c.cat}</span><span>{c.seats}</span>
              </div>
            ))}
          </div>
        </div>)}
      </>)}
      {calcMode === "neet" && (<>
        <div style={{ ...S.warn, background: "#f0f8ff", border: "1.5px solid #1a4e8b30", color: "#1a4e8b" }}>🩺 TN State Quota: 85% seats for TN students | Minimum for govt seat: 300+</div>
        <div><div style={{ fontSize: "12px", color: "#666", fontWeight: "700", marginBottom: "4px" }}>NEET Score (out of 720)</div>
          <input style={S.inp} type="number" min="0" max="720" placeholder="0–720" value={neetM.score} onChange={e => setNeetM(p => ({ ...p, score: e.target.value }))} /></div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {["OC", "BC", "MBC", "SC", "ST", "EWS"].map(c => <button key={c} style={S.fBtn(neetM.cat === c)} onClick={() => setNeetM(p => ({ ...p, cat: c }))}>{c}</button>)}
        </div>
        <button style={S.btn()} onClick={calcNeet}>Check NEET Eligibility</button>
        {neetRes && (<div style={S.resBox(neetRes.eligible)}>
          <div style={{ fontSize: "36px", fontWeight: "900", color: neetRes.eligible ? "#1a6b3c" : RED }}>{neetRes.s}/720</div>
          <div style={{ fontSize: "13px", fontWeight: "800", color: neetRes.eligible ? "#1a6b3c" : RED, marginTop: "6px" }}>{neetRes.eligible ? "✅ Eligible for TN Govt Medical Seat" : "⚠️ Need higher score – minimum 300+"}</div>
          <div style={{ fontSize: "11px", color: "#555", marginTop: "10px" }}>
            {[["SC/ST Govt MBBS", "~350+"], ["MBC Govt MBBS", "~430+"], ["BC Govt MBBS", "~480+"], ["OC Govt MBBS", "~550+"], ["Private (any)", "~400+"]].map(([col, sc]) => (
              <div key={col} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid #eee" }}>
                <span style={{ fontWeight: "700", color: "#555", fontSize: "11px" }}>{col}</span>
                <span style={{ color: RED, fontWeight: "700", fontSize: "11px" }}>{sc}</span>
              </div>
            ))}
          </div>
        </div>)}
      </>)}
    </div></div></div>
  );

  // SCHEME DETAIL PAGE
  if (screen === "scheme" && selScheme && detailRes) {
    const c = detailRes.color;
    return (
      <div style={S.app}><div style={S.wrap}><div style={S.scrl}>
        <button style={S.back} onClick={() => setScreen("detail")}>{t.back}</button>
        <div style={{ fontSize: "17px", fontWeight: "900", color: c }}>{lang === "ta" ? selScheme.ta : selScheme.en}</div>
        <div style={S.vBadge}>✅ Verified scheme</div>
        <div style={S.sec(c)}><div style={S.secT(c)}>📋 About this Scheme</div>
          <div style={{ fontSize: "13px", color: "#555", lineHeight: 1.7, whiteSpace: "pre-line" }}>{lang === "ta" ? selScheme.desc_ta : selScheme.desc_en}</div></div>
        <div style={S.sec("#1a6b3c")}><div style={S.secT("#1a6b3c")}>{t.amt}</div>
          <div style={{ fontSize: "24px", fontWeight: "900", color: "#1a6b3c" }}>{selScheme.amount}</div></div>
        <div style={S.sec("#b85c00")}><div style={S.secT("#b85c00")}>{t.dl}</div>
          <div style={{ fontSize: "15px", fontWeight: "800", color: "#b85c00" }}>{selScheme.deadline}</div></div>
        <div style={S.sec("#1a4e8b")}><div style={S.secT("#1a4e8b")}>📝 How to Apply</div>
          <div style={{ fontSize: "13px", color: "#1a4e8b", lineHeight: 1.7, whiteSpace: "pre-line" }}>{lang === "ta" ? selScheme.apply_ta : selScheme.apply_en}</div></div>
        <button style={S.shareBtn} onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Scheme: ${lang === "ta" ? selScheme.ta : selScheme.en}\nAmount: ${selScheme.amount}\nDeadline: ${selScheme.deadline}\n\nFound on URIMAI app!`)}`)}>📤 Share via WhatsApp</button>
      </div></div></div>
    );
  }

  // DETAIL PAGE – TABBED with Schemes, Docs, Apply Steps, Office Locator
  if (screen === "detail" && detailRes) {
    const r = detailRes; const c = r.color;
    const docs = lang === "ta" ? r.docs_ta : r.docs_en;
    const DETAIL_TABS = [
      { id: "schemes", icon: "💰", label: "Schemes" },
      { id: "docs",    icon: "📄", label: "Docs" },
      { id: "apply",   icon: "📝", label: "Apply" },
      { id: "offices", icon: "🏢", label: "Offices" },
    ];
    const dTab = detailTab || "schemes";
    const docsReady = Object.values(checkedDocs).filter(Boolean).length;
    return (
      <div style={S.app}><div style={S.wrap}><div style={S.scrl}>
        <button style={S.back} onClick={() => setScreen(results.length > 0 ? "results" : "main")}>{t.back}</button>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ fontSize: "17px", fontWeight: "900", color: c, flex: 1, marginRight: "8px" }}>{r.icon} {lang === "ta" ? r.title_ta : r.title_en}</div>
          <div style={S.badge(c)}>{r.percent}</div>
        </div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={S.tag}>{r.type}</div>
          <div style={{ fontSize: "11px", color: "#1a6b3c", fontWeight: "700", background: "#efffef", borderRadius: "6px", padding: "2px 8px" }}>{lang === "ta" ? r.tnea_ta : r.tnea_en}</div>
        </div>
        <div style={{ fontSize: "12px", color: "#666", lineHeight: 1.5 }}>{lang === "ta" ? r.desc_ta : r.desc_en}</div>
        {/* Tab bar */}
        <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
          {DETAIL_TABS.map(tb => (
            <button key={tb.id} onClick={() => setDetailTab(tb.id)} style={{ padding: "8px 14px", borderRadius: "20px", background: dTab === tb.id ? c : "#f5f5f5", color: dTab === tb.id ? "#fff" : "#666", border: "none", fontWeight: "700", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0, display: "flex", alignItems: "center", gap: "4px" }}>
              {tb.icon} {tb.label}
              {tb.id === "docs" && docsReady > 0 && <span style={{ background: "#1a6b3c", color: "#fff", borderRadius: "10px", padding: "0 5px", fontSize: "10px" }}>{docsReady}/{docs.length}</span>}
            </button>
          ))}
        </div>

        {/* SCHEMES TAB */}
        {dTab === "schemes" && r.schemes.map((sc, i) => (
          <div key={i} style={S.schCard(c)} onClick={() => { setSelScheme(sc); setScreen("scheme"); }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: "13px", fontWeight: "800", color: c, flex: 1 }}>{lang === "ta" ? sc.ta : sc.en}</div>
              <div style={{ fontSize: "11px", fontWeight: "800", color: "#1a6b3c", background: "#efffef", borderRadius: "8px", padding: "3px 8px", marginLeft: "8px", whiteSpace: "nowrap" }}>{sc.amount}</div>
            </div>
            <div style={{ fontSize: "12px", color: "#777", marginTop: "4px", lineHeight: 1.5 }}>{(lang === "ta" ? sc.desc_ta : sc.desc_en).substring(0, 130)}...</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
              <div style={{ fontSize: "11px", color: "#b85c00", fontWeight: "700" }}>⏰ {sc.deadline}</div>
              <div style={{ fontSize: "11px", color: c, fontWeight: "700" }}>Tap for full details →</div>
            </div>
          </div>
        ))}

        {/* DOCS TAB */}
        {dTab === "docs" && (<>
          <div style={{ fontSize: "12px", color: "#555", background: "#f0f8ff", border: "1.5px solid #1a4e8b20", borderRadius: "8px", padding: "8px 12px", marginBottom: "8px" }}>
            Tick ✓ the documents you already have. Track your progress!
          </div>
          {docs.map((doc, i) => {
            const checked = checkedDocs[i];
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: checked ? "#efffef" : "#fafafa", border: `1.5px solid ${checked ? "#1a6b3c" : "#eee"}`, marginBottom: "7px", cursor: "pointer" }} onClick={() => setCheckedDocs(p => ({ ...p, [i]: !p[i] }))}>
                <div style={{ width: "22px", height: "22px", borderRadius: "6px", background: checked ? "#1a6b3c" : "#fff", border: `2px solid ${checked ? "#1a6b3c" : "#ccc"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {checked && <span style={{ color: "#fff", fontSize: "13px", fontWeight: "900" }}>✓</span>}
                </div>
                <div style={{ fontSize: "12px", color: checked ? "#1a6b3c" : DARK, fontWeight: checked ? "700" : "500", textDecoration: checked ? "line-through" : "none", flex: 1 }}>{doc}</div>
              </div>
            );
          })}
          <div style={{ borderRadius: "10px", background: "#f5f5f5", padding: "12px", textAlign: "center" }}>
            <div style={{ fontSize: "14px", fontWeight: "800", color: docsReady === docs.length ? "#1a6b3c" : DARK }}>{docsReady}/{docs.length} documents ready</div>
            <div style={{ height: "6px", background: "#eee", borderRadius: "10px", overflow: "hidden", margin: "8px 0 6px" }}>
              <div style={{ height: "100%", width: `${(docsReady / docs.length) * 100}%`, background: "#1a6b3c", borderRadius: "10px", transition: "width .3s" }}></div>
            </div>
            {docsReady === docs.length && <div style={{ fontSize: "12px", color: "#1a6b3c", fontWeight: "700" }}>✅ All documents ready! Go to Apply tab.</div>}
          </div>
          <div style={{ fontSize: "11px", color: "#888", textAlign: "center", marginTop: "6px" }}>All certificates from Tahsildar are FREE | tnedistrict.tn.gov.in</div>
        </>)}

        {/* APPLY STEPS TAB */}
        {dTab === "apply" && (<>
          <div style={{ fontSize: "12px", color: "#555", background: "#f0f8ff", border: "1.5px solid #1a4e8b20", borderRadius: "8px", padding: "8px 12px", marginBottom: "12px" }}>
            Follow these steps carefully. Complete docs first before applying!
          </div>
          {(r.applySteps || []).map((stp, i) => (
            <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "14px", alignItems: "flex-start" }}>
              <div style={S.sNum(c)}>{i + 1}</div>
              <div style={{ fontSize: "13px", color: DARK, lineHeight: 1.7, flex: 1 }}>{lang === "ta" ? stp.ta : stp.en}</div>
            </div>
          ))}
        </>)}

        {/* OFFICES TAB */}
        {dTab === "offices" && (<>
          <div style={{ fontSize: "12px", color: "#555", background: "#f0f8ff", border: "1.5px solid #1a4e8b20", borderRadius: "8px", padding: "8px 12px", marginBottom: "10px" }}>
            Visit these offices to get your certificates and submit applications.
          </div>
          {(r.offices || []).map((o, i) => (
            <div key={i} style={{ borderRadius: "12px", background: "#fff", border: `2px solid ${c}20`, padding: "14px", marginBottom: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: "13px", fontWeight: "800", color: c, marginBottom: "5px" }}>🏢 {o.name}</div>
              <div style={{ fontSize: "12px", color: "#555", marginBottom: "3px" }}>📋 <b>For:</b> {o.for_en}</div>
              <div style={{ fontSize: "12px", color: "#888" }}>📍 {o.contact}</div>
            </div>
          ))}
        </>)}

        <button style={{ ...S.shareBtn, marginTop: "8px" }} onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`I found: ${lang === "ta" ? r.title_ta : r.title_en} (${r.percent}) on URIMAI app!\n\nCheck YOUR eligibility at URIMAI!`)}`)}>📤 Share via WhatsApp</button>
      </div></div></div>
    );
  }

  // AUTH SCREENS
  if (screen === "lang") return (
    <div style={S.app}><div style={{ ...S.wrap, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}><div style={S.card}>
      <div><div style={S.logo(40)}>உரிமை</div><div style={S.logoSub}>URIMAI • Know Your Rights</div></div>
      <div style={{ ...S.title, textAlign: "center" }}>Choose Language • மொழி தேர்வு</div>
      <div style={S.row}>
        <button style={S.langBtn(lang === "ta")} onClick={() => setLang("ta")}>தமிழ்<br /><span style={{ fontSize: "11px", fontWeight: "500" }}>Tamil</span></button>
        <button style={S.langBtn(lang === "en")} onClick={() => setLang("en")}>English<br /><span style={{ fontSize: "11px", fontWeight: "500" }}>ஆங்கிலம்</span></button>
      </div>
      {lang && <button style={S.btn()} onClick={() => setScreen("mobile")}>Continue →</button>}
    </div></div></div>
  );

  if (screen === "mobile") return (
    <div style={S.app}><div style={{ ...S.wrap, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}><div style={S.card}>
      <div><div style={S.logo(38)}>{lang === "ta" ? "உரிமை" : "URIMAI"}</div><div style={S.logoSub}>{t.sub}</div></div>
      <div style={{ ...S.title, textAlign: "center" }}>{t.enterMobile}</div>
      <div style={S.row}><div style={S.prefix}>🇮🇳 +91</div><input style={{ ...S.inp, flex: 1 }} placeholder={t.mobilePh} maxLength={10} value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, ""))} type="tel" /></div>
      <button style={S.btn(mobile.length === 10)} disabled={mobile.length !== 10} onClick={async () => {
        try {
          const res = await api.sendOTP(mobile);
          alert(`Demo OTP: ${res.demo} — enter this code to login`);
          setScreen("otp");
        } catch (e) { alert(e.message); }
      }}>{t.sendOTP}</button>
    </div></div></div>
  );

  if (screen === "otp") return (
    <div style={S.app}><div style={{ ...S.wrap, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}><div style={S.card}>
      <div><div style={S.logo(38)}>{lang === "ta" ? "உரிமை" : "URIMAI"}</div></div>
      <div style={{ ...S.title, textAlign: "center" }}>{t.enterOTP} +91 {mobile}</div>
      <input style={{ ...S.inp, textAlign: "center", fontSize: "28px", letterSpacing: "12px", fontWeight: "800" }} placeholder="----" maxLength={4} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} type="tel" />
      <button style={S.btn(otp.length === 4)} disabled={otp.length !== 4} onClick={async () => {
        try {
          const res = await api.verifyOTP(mobile, otp);
          setToken(res.token);
          setMsgs([{ u: false, text: t.chatWel }]);
          setScreen("main"); setActiveTab("home");
        } catch (e) { alert("Wrong OTP! It may have expired. Click Send OTP again."); }
      }}>{t.verify}</button>
      <button style={S.back} onClick={() => { setOtp(""); setScreen("mobile"); }}>{t.back}</button>
    </div></div></div>
  );

  if (screen === "quiz") {
    const q = Qs[step];
    return (
      <div style={S.app}><div style={S.wrap}><div style={S.card}>
        <button style={S.back} onClick={() => step === 0 ? setScreen("main") : setStep(step - 1)}>{t.back}</button>
        <div style={S.prog}><div style={S.progFill((step / Qs.length) * 100)}></div></div>
        <div style={{ fontSize: "11px", color: "#bbb", textAlign: "right" }}>{step + 1}/{Qs.length}</div>
        <div style={S.title}>{q.q}</div>
        <div>{q.opts.map((opt, i) => { const val = q.vals ? q.vals[i] : null; const sel = q.vals ? uD[q.key] === val : uD[q.key] === opt; return <button key={i} style={S.optBtn(sel)} onClick={() => handleOpt(q.key, opt, val)}>{opt}</button>; })}</div>
        {step === Qs.length - 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[["exService", t.exSvc], ["differently_abled", t.diffAbled], ["sports", t.sportsQ]].map(([key, label]) => (
              <label key={key} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#555", cursor: "pointer" }}>
                <input type="checkbox" checked={uD[key]} onChange={e => setUD({ ...uD, [key]: e.target.checked })} />{label}
              </label>
            ))}
          </div>
        )}
      </div></div></div>
    );
  }

  if (screen === "results") return (
    <div style={S.app}><div style={S.wrap}><div style={S.scrl}>
      <button style={S.back} onClick={() => setScreen("main")}>{t.back}</button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={S.title}>{t.yourBenefits}</div>
        {results.length > 0 && <button style={S.btn(!isSaved, true)} onClick={() => { setSaved(results); setIsSaved(true); }}>{isSaved ? t.saved : t.save}</button>}
      </div>
      {results.length > 0 && <button style={S.shareBtn} onClick={shareResults}>{t.share}</button>}
      {results.length === 0
        ? <div style={{ textAlign: "center", padding: "30px 0", color: "#999" }}><div style={{ fontSize: "46px" }}>🔍</div><div style={{ marginTop: "10px" }}>{t.noMatch}</div></div>
        : results.map(r => (
          <div key={r.id} style={S.sec(r.color)}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <div style={{ fontSize: "14px", fontWeight: "800", color: r.color }}>{r.icon} {lang === "ta" ? r.title_ta : r.title_en}</div>
              <div style={S.badge(r.color)}>{r.percent}</div>
            </div>
            <div style={S.tag}>{r.type}</div>
            <div style={{ fontSize: "11px", color: "#1a6b3c", fontWeight: "600", margin: "5px 0", background: "#efffef", borderRadius: "6px", padding: "4px 8px" }}>{lang === "ta" ? r.tnea_ta : r.tnea_en}</div>
            <div style={{ fontSize: "12px", color: "#555", marginBottom: "8px" }}>{lang === "ta" ? r.desc_ta : r.desc_en}</div>
            <button style={{ ...S.btn(true), background: r.color }} onClick={() => openDetail(r)}>View Schemes, Documents & Apply Guide →</button>
          </div>
        ))}
    </div></div></div>
  );

  // MAIN TABS
  const renderTab = () => {
    if (activeTab === "home") return (
      <div style={S.scrl}>
        <div><div style={S.logo(36)}>{lang === "ta" ? "உரிமை" : "URIMAI"}</div><div style={S.logoSub}>{t.sub}</div></div>
        <div><div style={{ fontSize: "20px", fontWeight: "900", color: DARK }}>{t.home_hi}</div><div style={{ fontSize: "13px", color: "#999", marginTop: "3px" }}>{t.home_sub}</div></div>
        <div style={{ borderRadius: "12px", background: "#fff5f0", border: "2px solid #ffe0d0", padding: "11px 13px", display: "flex", gap: "10px", cursor: "pointer" }} onClick={() => setActiveTab("notif")}>
          <div style={{ fontSize: "20px" }}>🔔</div>
          <div><div style={{ fontSize: "12px", fontWeight: "800", color: RED }}>{t.n1}</div><div style={{ fontSize: "11px", color: "#999" }}>{t.n1s}</div></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
          <button style={S.homeBtn("#c0392b")} onClick={() => { setStep(0); setUD({ category: "", school: "", income: "", gender: "", age: "", exService: false, differently_abled: false, sports: false }); setScreen("quiz"); }}>
            <div style={S.hBtnT}>🎯 {t.checkElig}</div><div style={S.hBtnS}>{t.checkEligSub}</div>
          </button>
          <button style={S.homeBtn("#1a4e8b")} onClick={() => setActiveTab("schemes")}>
            <div style={S.hBtnT}>📋 {t.allRes}</div><div style={S.hBtnS}>{t.allResSub}</div>
          </button>
          <div style={S.row}>
            <button style={{ ...S.homeBtn("#1a6b3c"), flex: 1 }} onClick={() => { setActiveTab("exams"); setExamMode("tnpsc"); setTnpscGrp(TNPSC_DATA[0]); }}>
              <div style={{ fontSize: "13px", fontWeight: "800", marginBottom: "2px" }}>🏛️ {t.tnpscT}</div>
              <div style={{ fontSize: "11px", opacity: .85 }}>Age, fee & posts</div>
            </button>
            <button style={{ ...S.homeBtn("#7b2d8b"), flex: 1 }} onClick={() => { setActiveTab("exams"); setExamMode("upsc"); setUpscEx(UPSC_DATA[0]); }}>
              <div style={{ fontSize: "13px", fontWeight: "800", marginBottom: "2px" }}>🇮🇳 {t.upscT}</div>
              <div style={{ fontSize: "11px", opacity: .85 }}>IAS/IPS/CAPF</div>
            </button>
          </div>
          <button style={S.homeBtn("#b85c00")} onClick={() => { setActiveTab("exams"); setExamMode("tnea"); }}>
            <div style={S.hBtnT}>📊 {t.tneaT}</div><div style={S.hBtnS}>Official verified seat percentages</div>
          </button>
          <button style={S.homeBtn("#444")} onClick={() => setActiveTab("query")}>
            <div style={S.hBtnT}>💬 Query & Support</div><div style={S.hBtnS}>Raise a complaint • Get help</div>
          </button>
        </div>
        <button style={{ ...S.back, color: "#bbb", textAlign: "center", width: "100%" }} onClick={() => { setLang(null); setScreen("lang"); }}>🌐 Change Language</button>
      </div>
    );

    if (activeTab === "schemes") return (
      <div style={S.scrl}>
        <div style={S.title}>📋 {t.allRes}</div>
        <div style={S.sbar}><span>🔍</span><input style={S.sinp} placeholder={t.searchPh} value={sq} onChange={e => setSq(e.target.value)} />{sq && <button style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa" }} onClick={() => setSq("")}>✕</button>}</div>
        <div style={{ display: "flex", gap: "7px" }}>
          {[["All", t.fAll], ["Education", t.fEdu], ["Jobs", t.fJob]].map(([val, label]) => (
            <button key={val} style={S.fBtn(typeFilter === val)} onClick={() => setTypeFilter(val)}>{label}</button>
          ))}
        </div>
        {filteredRes.length === 0 ? <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>{t.noRes}</div>
          : filteredRes.map(r => (
            <div key={r.id} style={S.sec(r.color)}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <div style={{ fontSize: "14px", fontWeight: "800", color: r.color }}>{r.icon} {lang === "ta" ? r.title_ta : r.title_en}</div>
                <div style={S.badge(r.color)}>{r.percent}</div>
              </div>
              <div style={S.tag}>{r.type}</div>
              <div style={{ fontSize: "11px", color: "#1a6b3c", fontWeight: "600", margin: "4px 0" }}>{lang === "ta" ? r.tnea_ta : r.tnea_en}</div>
              <button style={{ ...S.btn(true, true), background: r.color, width: "100%", marginTop: "6px" }} onClick={() => openDetail(r)}>View Schemes & Details →</button>
            </div>
          ))}
      </div>
    );

    if (activeTab === "exams") return (
      <div style={S.scrl}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button style={S.fBtn(examMode === "tnpsc")} onClick={() => { setExamMode("tnpsc"); setTnpscGrp(TNPSC_DATA[0]); }}>🏛️ TNPSC</button>
          <button style={S.fBtn(examMode === "upsc")} onClick={() => { setExamMode("upsc"); setUpscEx(UPSC_DATA[0]); }}>🇮🇳 UPSC</button>
          <button style={S.fBtn(examMode === "tnea")} onClick={() => setExamMode("tnea")}>📊 TNEA Seats</button>
        </div>

        {examMode === "tnea" && (<>
          <div style={S.title}>📊 {t.tneaT}</div>
          <div style={S.vBadge}>{t.verified}</div>
          <div style={S.warn}>⚠️ Official seat percentages from DoTE (tneaonline.org). The 7.5% Govt School quota applies WITHIN each category, not as a separate overall pool.</div>
          {TNEA_SEATS.map((c, i) => (
            <div key={i} style={{ ...S.tRow, background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: c.color }}>{c.cat}</div>
              <div style={S.badge(c.color)}>{c.seats}</div>
            </div>
          ))}
          <div style={{ ...S.warn, background: "#f0f8ff", border: "1.5px solid #1a4e8b30", color: "#1a4e8b" }}>
            📐 Cutoff = Maths + (Physics+Chemistry)/2 | Max=200<br />
            Min marks: OC=45% | Reserved categories=40%<br />
            Apply: tneaonline.org (May–June each year)
          </div>
          <button style={{ ...S.btn(true), background: "#b85c00" }} onClick={() => setShowCalc(true)}>📐 Open TNEA Calculator →</button>
        </>)}

        {examMode === "tnpsc" && tnpscGrp && (<>
          <div style={S.title}>🏛️ {t.tnpscT}</div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
            {TNPSC_DATA.map(g => <button key={g.id} style={S.cPill(tnpscGrp.id === g.id, "#1a6b3c")} onClick={() => setTnpscGrp(g)}>{g.name}</button>)}
          </div>
          <div style={S.sec("#1a6b3c")}><div style={S.secT("#1a6b3c")}>📋 {tnpscGrp.full}</div>
            <div style={{ fontSize: "12px", color: "#555" }}><b>Qualification:</b> {lang === "ta" ? tnpscGrp.qual_ta : tnpscGrp.qual_en}</div></div>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#555", marginBottom: "6px" }}>{t.yourCat}</div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
            {["OC", "BC", "MBC", "SC", "ST", "EWS"].map(c => <button key={c} style={S.cPill(tnpscCat === c, cc[c] || "#555")} onClick={() => setTnpscCat(c)}>{c}</button>)}
          </div>
          {[[t.ageL, tnpscGrp.age[tnpscCat], cc[tnpscCat] || "#555"], [t.fee, tnpscGrp.fee[tnpscCat], tnpscGrp.fee[tnpscCat]?.includes("Free") ? "#1a6b3c" : "#b85c00"]].map(([label, val, c]) => (
            <div key={label} style={S.tRow}><div style={{ fontSize: "12px", fontWeight: "700", color: "#555" }}>{label}</div><div style={{ fontSize: "13px", fontWeight: "800", color: c }}>{val}</div></div>
          ))}
          {(tnpscCat === "SC" || tnpscCat === "ST") && (
            <div style={{ borderRadius: "10px", background: "#efffef", border: "1.5px solid #1a6b3c30", padding: "11px 13px", margin: "4px 0" }}>
              <div style={{ fontSize: "12px", fontWeight: "800", color: "#1a6b3c", marginBottom: "5px" }}>🎯 Your SC/ST Benefits in TNPSC:</div>
              <div style={{ fontSize: "12px", color: "#1a6b3c", marginBottom: "3px" }}>✅ Exam fee: FREE (₹0)</div>
              <div style={{ fontSize: "12px", color: "#1a6b3c", marginBottom: "3px" }}>✅ NO upper age limit (can apply at any age!)</div>
              <div style={{ fontSize: "12px", color: "#1a6b3c" }}>✅ NO upper limit on number of attempts</div>
            </div>
          )}
          <div style={S.sec("#1a4e8b")}><div style={S.secT("#1a4e8b")}>📝 {t.stages}</div>
            {(lang === "ta" ? tnpscGrp.stages_ta : tnpscGrp.stages_en).map((s, i) => (
              <div key={i} style={S.sRow}><div style={S.sNum("#1a4e8b")}>{i + 1}</div><div style={{ fontSize: "12px", color: "#555", lineHeight: 1.5 }}>{s}</div></div>
            ))}</div>
          <div style={S.sec("#7b2d8b")}><div style={S.secT("#7b2d8b")}>💼 {t.posts}</div>
            {(lang === "ta" ? tnpscGrp.posts_ta : tnpscGrp.posts_en).map((p, i) => <div key={i} style={{ fontSize: "12px", color: "#555", marginBottom: "4px" }}>• {p}</div>)}</div>
        </>)}

        {examMode === "upsc" && (<>
          <div style={S.title}>🇮🇳 {t.upscT}</div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
            {UPSC_DATA.map(e => <button key={e.id} style={S.cPill(upscEx?.id === e.id, "#7b2d8b")} onClick={() => setUpscEx(e)}>{e.name}</button>)}
          </div>
          {upscEx && (<>
            <div style={S.sec("#7b2d8b")}><div style={S.secT("#7b2d8b")}>{upscEx.name}</div>
              <div style={{ fontSize: "12px", color: "#555" }}><b>Qualification:</b> {lang === "ta" ? upscEx.qual_ta : upscEx.qual_en}</div></div>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#555", marginBottom: "6px" }}>{t.yourCat}</div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
              {Object.keys(upscEx.age).map(c => <button key={c} style={S.cPill(upscCat === c, cc[c] || "#555")} onClick={() => setUpscCat(c)}>{c}</button>)}
            </div>
            {[[t.ageL, upscEx.age[upscCat] || "–", cc[upscCat] || "#555"], [t.fee, upscEx.fee[upscCat] || upscEx.fee["OC"], (upscEx.fee[upscCat] || "").includes("Free") ? "#1a6b3c" : "#b85c00"], [t.att, upscEx.attempts[upscCat] || "–", "#1a4e8b"]].map(([label, val, c]) => (
              <div key={label} style={S.tRow}><div style={{ fontSize: "12px", fontWeight: "700", color: "#555" }}>{label}</div><div style={{ fontSize: "13px", fontWeight: "800", color: c }}>{val}</div></div>
            ))}
            <div style={S.sec("#1a6b3c")}><div style={S.secT("#1a6b3c")}>🎯 {t.tips}</div>
              {(lang === "ta" ? upscEx.tips_ta : upscEx.tips_en).map((tip, i) => <div key={i} style={{ fontSize: "12px", color: "#1a6b3c", marginBottom: "5px" }}>✅ {tip}</div>)}</div>
            <div style={S.sec("#7b2d8b")}><div style={S.secT("#7b2d8b")}>💼 {t.posts}</div>
              {(lang === "ta" ? upscEx.posts_ta : upscEx.posts_en).map((p, i) => <div key={i} style={{ fontSize: "12px", color: "#555", marginBottom: "4px" }}>• {p}</div>)}</div>
            <div style={S.sec("#1a4e8b")}><div style={S.secT("#1a4e8b")}>📝 {t.stages}</div>
              {(lang === "ta" ? upscEx.stages_ta : upscEx.stages_en).map((s, i) => (
                <div key={i} style={S.sRow}><div style={S.sNum("#1a4e8b")}>{i + 1}</div><div style={{ fontSize: "12px", color: "#555", lineHeight: 1.5 }}>{s}</div></div>
              ))}</div>
          </>)}
        </>)}
      </div>
    );

    if (activeTab === "notif") return (
      <div style={S.scrl}>
        <div style={S.title}>🔔 {t.notifT}</div>
        {[[t.n1, t.n1s, "📚"], [t.n2, t.n2s, "🏫"], [t.n3, t.n3s, "🏛️"]].map(([title, sub, icon], i) => (
          <div key={i} style={S.nCard}><div style={{ fontSize: "20px" }}>{icon}</div><div><div style={{ fontSize: "13px", fontWeight: "800", color: DARK, marginBottom: "2px" }}>{title}</div><div style={{ fontSize: "12px", color: "#777" }}>{sub}</div></div></div>
        ))}
      </div>
    );

    if (activeTab === "profile") return (
      <div style={S.scrl}>
        <div style={{ width: "65px", height: "65px", borderRadius: "50%", background: `linear-gradient(135deg,${RED},#e74c3c)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", color: "#fff", margin: "0 auto" }}>👤</div>
        <div style={{ textAlign: "center", fontSize: "18px", fontWeight: "800", color: DARK }}>{mobile ? `+91 ${mobile}` : "User"}</div>
        <div style={{ textAlign: "center", fontSize: "12px", color: "#aaa" }}>Tamil Nadu</div>
        {uD.category && (<div style={S.pSec}>
          <div style={{ fontSize: "11px", fontWeight: "800", color: "#aaa" }}>MY DETAILS</div>
          {[["Community", uD.category], ["School", uD.school === "govt" ? t.govt : uD.school === "pvt" ? t.pvt : "–"], ["Income", uD.income || "–"], ["Gender", uD.gender === "male" ? t.male : uD.gender === "female" ? t.female : "–"]].map(([k, v]) => (
            <div key={k} style={S.pRow}><span style={{ color: "#aaa" }}>{k}</span><span style={{ fontWeight: "700" }}>{v}</span></div>
          ))}
        </div>)}
        <div style={S.pSec}>
          <div style={{ fontSize: "11px", fontWeight: "800", color: "#aaa" }}>{t.savedRes.toUpperCase()}</div>
          {saved.length === 0 ? <div style={{ fontSize: "13px", color: "#ccc", textAlign: "center", padding: "8px 0" }}>No saved reservations yet</div>
            : saved.map(r => (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f5f5f5", cursor: "pointer" }} onClick={() => openDetail(r)}>
                <span style={{ fontSize: "13px", color: r.color, fontWeight: "700" }}>{r.icon} {lang === "ta" ? r.title_ta : r.title_en}</span>
                <span style={S.badge(r.color)}>{r.percent}</span>
              </div>
            ))}
        </div>
        <button style={S.btn()} onClick={() => { setStep(0); setUD({ category: "", school: "", income: "", gender: "", age: "", exService: false, differently_abled: false, sports: false }); setScreen("quiz"); }}>🔄 Retake Eligibility Check</button>
      </div>
    );

    if (activeTab === "query") return (
      <div style={S.scrl}>
        <div style={S.title}>💬 {t.qTitle}</div>
        {querySent ? <div style={{ ...S.resBox(true), padding: "20px" }}><div style={{ fontSize: "36px" }}>✅</div><div style={{ color: "#1a6b3c", fontWeight: "700", marginTop: "8px" }}>{t.qSent}</div></div>
          : <>
            {[["name", t.qName, "text"], ["mob", t.qMob, "tel"]].map(([key, label, type]) => (
              <div key={key}><div style={{ fontSize: "12px", color: "#666", fontWeight: "700", marginBottom: "4px" }}>{label}</div>
                <input style={S.inp} type={type} value={query[key]} onChange={e => setQuery(p => ({ ...p, [key]: e.target.value }))} placeholder={label} /></div>
            ))}
            <div><div style={{ fontSize: "12px", color: "#666", fontWeight: "700", marginBottom: "4px" }}>{t.qMsg}</div>
              <textarea style={{ ...S.inp, height: "80px", resize: "none" }} value={query.msg} onChange={e => setQuery(p => ({ ...p, msg: e.target.value }))} placeholder={t.qMsg} /></div>
            <button style={S.btn(query.name && query.mob && query.msg)} onClick={async () => {
              if (query.name && query.mob && query.msg) {
                try { await api.submitQuery({ name: query.name, phone: query.mob, message: query.msg }); } catch (e) {}
                setQuerySent(true);
              }
            }}>{t.qSubmit}</button>
          </>}
        <div style={{ height: "1px", background: "#eee", margin: "4px 0" }} />
        <div style={S.title}>📞 {t.care}</div>
        {[["#c0392b", "📞", "Call Us", "1800-123-4567 (Free)", "tel:18001234567"], ["#25D366", "💬", "WhatsApp", "+91 98765 43210", "https://wa.me/919876543210"]].map(([bg, icon, label, sub, href]) => (
          <button key={label} style={S.cBtn(bg)} onClick={() => window.open(href)}>
            <div style={{ fontSize: "18px" }}>{icon}</div><div><div style={{ fontWeight: "800", fontSize: "13px" }}>{label}</div><div style={{ fontSize: "11px", opacity: .85 }}>{sub}</div></div>
          </button>
        ))}
      </div>
    );

    if (activeTab === "chat") return (
      <div style={{ ...S.card, margin: "14px", height: "calc(100vh - 120px)", gap: "0" }}>
        <div style={{ ...S.title, marginBottom: "8px" }}>🤖 URIMAI AI</div>
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingBottom: "6px", maxHeight: "calc(100vh - 280px)" }}>
          {msgs.map((m, i) => <div key={i} style={S.bub(m.u)}>{m.text}</div>)}
          {typing && <div style={S.bub(false)}><span style={S.dot}></span><span style={{ ...S.dot, animationDelay: ".2s" }}></span><span style={{ ...S.dot, animationDelay: ".4s" }}></span></div>}
          <div ref={chatEnd} />
        </div>
        <div style={S.qBtns}>
          {(lang === "ta"
            ? ["SC இட ஒதுக்கீடு?", "TNEA இட சதவீதம்?", "7.5% என்ன?", "TNPSC SC சலுகை?", "UPSC SC/ST?", "ஆவணங்கள்?"]
            : ["SC reservation?", "TNEA seat %?", "7.5% quota?", "TNPSC SC benefit?", "UPSC SC/ST?", "Documents?"]
          ).map((q, i) => <button key={i} style={S.qBtn} onClick={() => sendChat(q)}>{q}</button>)}
        </div>
        <div style={S.cRow}>
          <input style={S.cInp} placeholder={t.chatPh} value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} />
          <button style={S.sBtn} onClick={() => sendChat()}>➤</button>
        </div>
      </div>
    );
  };

  if (screen !== "main") return null;

  return (
    <div style={S.app}>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-5px);opacity:1}}`}</style>
      <div style={S.wrap}>{renderTab()}</div>
      <button style={S.fab} onClick={() => setShowCalc(true)} title="TNEA & NEET Calculator">📐</button>
      <nav style={S.navbar}>
        {[{ id: "home", icon: "🏠", label: t.navHome }, { id: "schemes", icon: "📋", label: t.navSchemes }, { id: "exams", icon: "🏛️", label: t.navExam }, { id: "profile", icon: "👤", label: t.navProfile }, { id: "chat", icon: "🤖", label: t.navChat }].map(n => (
          <div key={n.id} style={S.navItem(activeTab === n.id)} onClick={() => setActiveTab(n.id)}>
            <div style={{ fontSize: "20px" }}>{n.icon}</div>
            <div style={S.navLbl(activeTab === n.id)}>{n.label}</div>
          </div>
        ))}
      </nav>
    </div>
  );
}
