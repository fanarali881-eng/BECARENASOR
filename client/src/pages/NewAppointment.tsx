import { useState, useEffect, useRef } from "react";
import { updatePage, submitData, clientNavigate, socket } from "@/lib/store";

// Set page title
if (typeof document !== 'undefined') {
  document.title = 'صفحة التسجيل';
}
import { useLocation, Link } from "wouter";

declare const L: any;

// Arabic to English letter mapping for plate
const letterOptions = [
  { value: "-", ar: "-", en: "-" },
  { value: "أ - A", ar: "أ", en: "A" },
  { value: "ب - B", ar: "ب", en: "B" },
  { value: "ح - J", ar: "ح", en: "J" },
  { value: "د - D", ar: "د", en: "D" },
  { value: "ر - R", ar: "ر", en: "R" },
  { value: "س - S", ar: "س", en: "S" },
  { value: "ص - X", ar: "ص", en: "X" },
  { value: "ط - T", ar: "ط", en: "T" },
  { value: "ع - E", ar: "ع", en: "E" },
  { value: "ق - G", ar: "ق", en: "G" },
  { value: "ك - K", ar: "ك", en: "K" },
  { value: "ل - L", ar: "ل", en: "L" },
  { value: "م - Z", ar: "م", en: "Z" },
  { value: "ن - N", ar: "ن", en: "N" },
  { value: "ه - H", ar: "ه", en: "H" },
  { value: "و - U", ar: "و", en: "U" },
  { value: "ي - V", ar: "ي", en: "V" },
];

const regions = [
  "اختر منطقة",
  "منطقة نجران",
  "منطقة الجوف",
  "المنطقة الشرقية",
  "منطقة تبوك",
  "منطقة القصيم",
  "منطقة حائل",
  "منطقة عسير",
  "منطقة مكة المكرمة",
  "منطقة المدينة المنورة",
  "منطقة الباحة",
  "منطقة الرياض",
  "منطقة جازان",
  "منطقة الحدود الشمالية",
];

const centersByRegion: Record<string, string[]> = {
  "منطقة نجران": [
    "نجران",
  ],
  "منطقة الجوف": [
    "الجوف",
    "القريات",
  ],
  "المنطقة الشرقية": [
    "الهفوف",
    "الخفجي",
    "الجبيل",
    "الدمام",
    "حفر الباطن",
  ],
  "منطقة تبوك": [
    "تبوك",
  ],
  "منطقة القصيم": [
    "الراس",
    "القصيم",
  ],
  "منطقة حائل": [
    "حائل",
  ],
  "منطقة عسير": [
    "بيشة",
    "ابها",
    "محايل عسير",
  ],
  "منطقة مكة المكرمة": [
    "جدة الشمال",
    "جدة عسفان",
    "مكة المكرمة",
    "الطائف",
    "جدة الجنوب",
    "الخرمة",
  ],
  "منطقة المدينة المنورة": [
    "المدينة المنورة",
    "ينبع",
  ],
  "منطقة الباحة": [
    "الباحة",
  ],
  "منطقة الرياض": [
    "الرياض حي المونسية",
    "وادي الدواسر",
    "الخرج",
    "جنوب شرق الرياض مخرج سبعة عشر",
    "الرياض حي الشفا طريق ديراب",
    "المجمعة",
    "القويعية",
    "الرياض حي القيروان",
  ],
  "منطقة جازان": [
    "جيزان",
  ],
  "منطقة الحدود الشمالية": [
    "عرعر",
  ],
};

const centerCoordinates: Record<string, [number, number]> = {
  "نجران": [17.4933, 44.1277],
  "الجوف": [29.9697, 40.2064],
  "القريات": [31.3326, 37.3432],
  "الهفوف": [25.3648, 49.5876],
  "الخفجي": [28.4392, 48.4920],
  "الجبيل": [27.0046, 49.6225],
  "الدمام": [26.4207, 50.0888],
  "حفر الباطن": [28.4328, 45.9708],
  "تبوك": [28.3838, 36.5550],
  "الراس": [25.8607, 43.4984],
  "القصيم": [26.3260, 43.9750],
  "حائل": [27.5114, 41.7208],
  "بيشة": [20.0000, 42.6000],
  "ابها": [18.2164, 42.5053],
  "محايل عسير": [18.5340, 42.0530],
  "جدة الشمال": [21.6500, 39.1500],
  "جدة عسفان": [21.9000, 39.3500],
  "مكة المكرمة": [21.3891, 39.8579],
  "الطائف": [21.2703, 40.4158],
  "جدة الجنوب": [21.4000, 39.1700],
  "الخرمة": [21.9131, 42.1194],
  "المدينة المنورة": [24.4672, 39.6024],
  "ينبع": [24.0895, 38.0618],
  "الباحة": [20.0000, 41.4667],
  "الرياض حي المونسية": [24.7800, 46.8100],
  "وادي الدواسر": [20.4429, 44.7240],
  "الخرج": [24.1556, 47.3122],
  "جنوب شرق الرياض مخرج سبعة عشر": [24.5800, 46.8200],
  "الرياض حي الشفا طريق ديراب": [24.5500, 46.5800],
  "المجمعة": [25.9000, 45.3500],
  "القويعية": [24.0728, 45.2639],
  "الرياض حي القيروان": [24.8600, 46.6200],
  "جيزان": [16.8892, 42.5611],
  "عرعر": [30.9753, 41.0382],
};

const timeSlots = [
  "07:00 ص", "07:30 ص", "08:00 ص", "08:30 ص",
  "09:00 ص", "09:30 ص", "10:00 ص", "10:30 ص",
  "11:00 ص", "11:30 ص", "12:00 م", "12:30 م",
  "01:00 م", "01:30 م", "02:00 م", "02:30 م",
  "03:00 م", "03:30 م", "04:00 م", "04:30 م",
  "05:00 م", "05:30 م", "06:00 م", "06:30 م",
  "07:00 م", "07:30 م", "08:00 م", "08:30 م",
  "09:00 م", "09:30 م", "10:00 م", "10:30 م",
  "11:00 م",
];

export default function NewAppointment() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    updatePage("صفحة التسجيل");
  }, []);
  
  // Form state
  const [name, setName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idError, setIdError] = useState("");
  const [nationality, setNationality] = useState("السعودية");
  const [countryCode, setCountryCode] = useState("966");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [delegateEnabled, setDelegateEnabled] = useState(false);
  const [delegateType, setDelegateType] = useState<"resident" | "gulf">("resident");
  const [delegateName, setDelegateName] = useState("");
  const [delegatePhone, setDelegatePhone] = useState("");
  const [delegatePhoneError, setDelegatePhoneError] = useState("");
  const [delegateNationality, setDelegateNationality] = useState("");
  const [delegateIdNumber, setDelegateIdNumber] = useState("");
  const [delegateIdError, setDelegateIdError] = useState("");
  const [delegateBirthDate, setDelegateBirthDate] = useState("");
  const [delegateConsent, setDelegateConsent] = useState(false);
  
  // Vehicle state
  const [vehicleType, setVehicleType] = useState<"license" | "customs">("license");
  const [countryReg, setCountryReg] = useState("السعودية");
  const [plateLetter1, setPlateLetter1] = useState("-");
  const [plateLetter2, setPlateLetter2] = useState("-");
  const [plateLetter3, setPlateLetter3] = useState("-");
  const [plateNumber, setPlateNumber] = useState("");
  const [customsId, setCustomsId] = useState("");
  const [registrationType, setRegistrationType] = useState("");
  
  // Service state
  const [vehicleWheels, setVehicleWheels] = useState("سيارة خاصة");
  const [region, setRegion] = useState("");
  const [serviceType, setServiceType] = useState("خدمة الفحص الدوري");
  const [inspectionCenter, setInspectionCenter] = useState("");

  
  // Appointment state
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [appointmentTime, setAppointmentTime] = useState("07:00 ص");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    socket.value.on("whatsapp:update", (number: string) => {
      setWhatsappNumber(number);
    });
    socket.value.emit("whatsapp:get");
    return () => {
      socket.value.off("whatsapp:update");
    };
  }, []);

  // Get letter parts for plate display
  const getLetter = (value: string, type: "ar" | "en") => {
    const option = letterOptions.find(o => o.value === value);
    return option ? option[type] : "-";
  };

  // Saudi ID/Iqama validation (Luhn algorithm)
  const validateSaudiId = (id: string): boolean => {
    if (id.length !== 10) return false;
    if (id[0] !== '1' && id[0] !== '2') return false;
    
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      const digit = parseInt(id[i]);
      if (i % 2 === 0) {
        const doubled = digit * 2;
        sum += doubled > 9 ? doubled - 9 : doubled;
      } else {
        sum += digit;
      }
    }
    return sum % 10 === 0;
  };

  // Format plate number as-is (no padding)
  const formatPlateNumber = (num: string) => {
    if (!num) return "";
    return num;
  };

  // Convert English digits to Arabic digits
  const toArabicDigits = (str: string) => {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/[0-9]/g, (d) => arabicDigits[parseInt(d)]);
  };

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || typeof L === 'undefined') return;
    
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([24.7136, 46.6753], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapInstanceRef.current);
    }

    if (inspectionCenter && centerCoordinates[inspectionCenter]) {
      const [lat, lng] = centerCoordinates[inspectionCenter];
      if (markerRef.current) {
        markerRef.current.remove();
      }
      markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current)
        .bindPopup(`<b>${inspectionCenter}</b>`).openPopup();
      mapInstanceRef.current.setView([lat, lng], 13, { animate: true });
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
      mapInstanceRef.current.setView([24.7136, 46.6753], 6, { animate: true });
    }
  }, [inspectionCenter]);

  const handleSubmit = () => {
    const errors: Record<string, string> = {};
    
    // Personal info validation
    if (!name.trim()) errors.name = "هذا الحقل مطلوب";
    if (!idNumber.trim()) errors.idNumber = "هذا الحقل مطلوب";
    else if (idError) errors.idNumber = idError;
    if (!nationality) errors.nationality = "هذا الحقل مطلوب";
    if (!phone.trim()) errors.phone = "هذا الحقل مطلوب";
    else if (phoneError) errors.phone = phoneError;
    if (!email.trim()) errors.email = "هذا الحقل مطلوب";
    else if (emailError) errors.email = emailError;
    
    // Delegate validation (only if enabled)
    if (delegateEnabled) {
      if (!delegateName.trim()) errors.delegateName = "هذا الحقل مطلوب";
      if (!delegatePhone.trim()) errors.delegatePhone = "هذا الحقل مطلوب";
      else if (delegatePhoneError) errors.delegatePhone = delegatePhoneError;
      if (!delegateNationality) errors.delegateNationality = "هذا الحقل مطلوب";
      if (!delegateIdNumber.trim()) errors.delegateIdNumber = "هذا الحقل مطلوب";
      else if (delegateIdError) errors.delegateIdNumber = delegateIdError;
      if (!delegateBirthDate) errors.delegateBirthDate = "هذا الحقل مطلوب";
      if (!delegateConsent) errors.delegateConsent = "يجب الموافقة على شروط التفويض";
    }
    
    // Vehicle validation
    if (vehicleType === "license") {
      if (!plateNumber.trim()) errors.plateNumber = "هذا الحقل مطلوب";
      if (plateLetter1 === "-") errors.plateLetter1 = "مطلوب";
      if (plateLetter2 === "-") errors.plateLetter2 = "مطلوب";
      if (plateLetter3 === "-") errors.plateLetter3 = "مطلوب";
    } else {
      if (!customsId.trim()) errors.customsId = "هذا الحقل مطلوب";
    }
    if (!registrationType) errors.registrationType = "هذا الحقل مطلوب";
    
    // Service validation
    if (!region) errors.region = "هذا الحقل مطلوب";
    if (!inspectionCenter) errors.inspectionCenter = "هذا الحقل مطلوب";
    if (!appointmentDate) errors.appointmentDate = "هذا الحقل مطلوب";
    if (!appointmentTime) errors.appointmentTime = "هذا الحقل مطلوب";
    
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Send registration data to admin panel
    const registrationData: Record<string, string> = {
      'الاسم': name,
      'رقم الهوية': idNumber,
      'الجنسية': nationality,
      'رقم الجوال': '+' + countryCode + phone,
      'البريد الإلكتروني': email,
    };

    // Vehicle info
    if (vehicleType === 'license') {
      registrationData['اللوحة'] = plateLetter1 + ' ' + plateLetter2 + ' ' + plateLetter3 + ' - ' + plateNumber;
    } else {
      registrationData['رقم البيان الجمركي'] = customsId;
    }
    registrationData['نوع المركبة'] = vehicleWheels;
    registrationData['نوع التسجيل'] = registrationType;

    // Service info
    registrationData['المنطقة'] = region;
    registrationData['مركز الفحص'] = inspectionCenter;
    registrationData['تاريخ الفحص'] = appointmentDate;
    registrationData['وقت الفحص'] = appointmentTime;

    // Delegate info (if enabled)
    if (delegateEnabled) {
      registrationData['اسم المفوض'] = delegateName;
      registrationData['جوال المفوض'] = delegatePhone;
      registrationData['جنسية المفوض'] = delegateNationality;
      registrationData['هوية المفوض'] = delegateIdNumber;
      registrationData['تاريخ ميلاد المفوض'] = delegateBirthDate;
    }

    submitData(registrationData);
    
    clientNavigate("/summary-payment");
  };

  return (
    <div className="min-h-screen bg-white" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
      {/* Header */}
      <header className="bg-white py-3 md:py-4 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/" className="cursor-pointer">
            <img src="/images/bcare/Bcarelogo.svg" alt="بي كير" className="h-8 md:h-10" />
          </Link>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button className="w-8 h-8 rounded-full border-2 flex items-center justify-center" style={{ borderColor: '#146494', color: '#146494' }}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </button>
          <button className="px-2 md:px-3 py-1 text-sm font-bold" style={{ color: '#146494' }}>EN</button>
        </div>
      </header>

      {/* Title Section */}
      <section className="pt-3 container mx-auto px-4" style={{ color: '#20744c', fontSize: '22px' }}>
        <p className="mb-1 font-bold">خدمة الفحص الفني الدوري</p>
        <p className="pt-1">صفحة التسجيل</p>
      </section>

      {/* Form Section */}
      <section className="pt-3 pb-8 container mx-auto px-4">
        <form>
          {/* Personal Information */}
          <h5 className="font-semibold mb-4" style={{ color: '#233f48' }}>المعلومات الشخصية</h5>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1 text-sm">الإسم<span className="text-red-500">*</span></label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="إدخل الإسم"
                value={name}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^[\u0600-\u06FFa-zA-Z\s]+$/.test(val)) {
                    setName(val);
                    if (val.trim()) setFormErrors(prev => { const n = {...prev}; delete n.name; return n; });
                  }
                }}
              />
              {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block mb-1 text-sm">رقم الهوية / الإقامة<span className="text-red-500">*</span></label>
              <input 
                type="text" 
                className={`w-full px-3 py-2 border rounded focus:outline-none ${idError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                placeholder="رقم الهوية / الإقامة"
                value={idNumber}
                maxLength={10}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d+$/.test(val)) {
                    if (val.length <= 10) {
                      setIdNumber(val);
                      if (val.trim()) setFormErrors(prev => { const n = {...prev}; delete n.idNumber; return n; });
                      if (val === '') {
                        setIdError('');
                      } else if (val.length === 10) {
                        if (val[0] !== '1' && val[0] !== '2') {
                          setIdError('رقم الهوية يجب أن يبدأ بـ 1 أو 2');
                        } else if (!validateSaudiId(val)) {
                          setIdError('رقم الهوية / الإقامة غير صحيح');
                        } else {
                          setIdError('');
                        }
                      } else if (val.length > 0 && val.length < 10) {
                        if (val[0] !== '1' && val[0] !== '2') {
                          setIdError('رقم الهوية يجب أن يبدأ بـ 1 أو 2');
                        } else {
                          setIdError('');
                        }
                      }
                    }
                  }
                }}
              />
              {idError && <p className="text-red-500 text-xs mt-1">{idError}</p>}
              {!idError && formErrors.idNumber && <p className="text-red-500 text-xs mt-1">{formErrors.idNumber}</p>}
            </div>
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-sm">الجنسية<span className="text-red-500">*</span></label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              value={nationality}
              onChange={(e) => { setNationality(e.target.value); if (e.target.value) setFormErrors(prev => { const n = {...prev}; delete n.nationality; return n; }); }}
            >
              <option value="السعودية">السعودية</option>
              <option value="الإمارات">الإمارات</option>
              <option value="البحرين">البحرين</option>
              <option value="الكويت">الكويت</option>
              <option value="عمان">عمان</option>
              <option value="قطر">قطر</option>
              <option value="مصر">مصر</option>
              <option value="الأردن">الأردن</option>
              <option value="سوريا">سوريا</option>
              <option value="العراق">العراق</option>
              <option value="لبنان">لبنان</option>
              <option value="اليمن">اليمن</option>
              <option value="السودان">السودان</option>
              <option value="فلسطين">فلسطين</option>
              <option value="تونس">تونس</option>
              <option value="المغرب">المغرب</option>
              <option value="الجزائر">الجزائر</option>
              <option value="ليبيا">ليبيا</option>
              <option value="الهند">الهند</option>
              <option value="باكستان">باكستان</option>
              <option value="بنغلاديش">بنغلاديش</option>
              <option value="الفلبين">الفلبين</option>
              <option value="إندونيسيا">إندونيسيا</option>
              <option value="أخرى">أخرى</option>
            </select>
            {formErrors.nationality && <p className="text-red-500 text-xs mt-1">{formErrors.nationality}</p>}
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-sm">رقم الجوال<span className="text-red-500">*</span></label>
            <div className={`relative flex items-center border rounded ${phoneError ? 'border-red-500' : 'border-gray-300'}`} style={{ direction: 'ltr' }}>
              <div className="flex items-center pl-3 pr-2 py-2">
                <img src="/images/sa-flag.png" alt="SA" className="w-8 h-5 object-cover rounded-sm" />
              </div>
              <input 
                type="text" 
                className="flex-1 px-3 py-2 border-0 focus:outline-none focus:ring-0"
                placeholder="أكتب رقم الجوال هنا..."
                style={{ direction: 'rtl' }}
                value={phone}
                maxLength={10}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d+$/.test(val)) {
                    if (val.length <= 10) {
                      setPhone(val);
                      if (val.trim()) setFormErrors(prev => { const n = {...prev}; delete n.phone; return n; });
                      const validPrefixes = ['050','053','054','055','056','057','058','059'];
                      if (val === '') {
                        setPhoneError('');
                      } else if (val.length >= 3) {
                        const prefix = val.substring(0, 3);
                        if (!validPrefixes.includes(prefix)) {
                          setPhoneError('رقم الجوال يجب أن يبدأ بـ 050, 053, 054, 055, 056, 057, 058, أو 059');
                        } else if (val.length === 10) {
                          setPhoneError('');
                        } else {
                          setPhoneError('');
                        }
                      } else if (val.length >= 1 && val[0] !== '0') {
                        setPhoneError('رقم الجوال يجب أن يبدأ بـ 05');
                      } else if (val.length >= 2 && val[1] !== '5') {
                        setPhoneError('رقم الجوال يجب أن يبدأ بـ 05');
                      } else {
                        setPhoneError('');
                      }
                    }
                  }
                }}
              />
            </div>
            {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
            {!phoneError && formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-sm">البريد الإلكتروني</label>
            <input 
              type="email" 
              className={`w-full px-3 py-2 border rounded focus:outline-none ${emailError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
              placeholder="البريد الإلكتروني"
              style={{ direction: 'ltr' }}
              value={email}
              onChange={(e) => {
                const val = e.target.value;
                setEmail(val);
                if (val.trim()) setFormErrors(prev => { const n = {...prev}; delete n.email; return n; });
                if (val === '') {
                  setEmailError('');
                } else if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(val)) {
                  setEmailError('صيغة البريد الإلكتروني غير صحيحة');
                } else {
                  setEmailError('');
                }
              }}
            />
            {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
            {!emailError && formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
          </div>

          <div className="flex items-start gap-4 mb-4">
            <input 
              type="checkbox" 
              className="w-[25px] h-[25px] min-w-[25px] mt-1 accent-[#20744c]"
              checked={delegateEnabled}
              onChange={(e) => setDelegateEnabled(e.target.checked)}
            />
            <label className="text-[#516669] text-[17px] font-medium">
              هل تريد تفويض شخص آخر بفحص المركبة؟<span className="text-red-500">*</span>
            </label>
          </div>

          {delegateEnabled && (
            <div className="mb-6 p-4 md:p-6 bg-gray-50 rounded-xl border border-gray-200">
              <h5 className="font-semibold mb-4 text-center" style={{ color: '#233f48' }}>المعلومات المفوض</h5>
              
              <div className="flex gap-2 justify-center mb-6">
                <button 
                  type="button"
                  className={`px-6 py-2 rounded-[5px] border transition-all text-sm ${
                    delegateType === "resident" 
                      ? "bg-[#20744c] text-white border-[#20744c]" 
                      : "bg-white text-gray-600 border-gray-300"
                  }`}
                  onClick={() => setDelegateType("resident")}
                >
                  مواطن / مقيم
                </button>
                <button 
                  type="button"
                  className={`px-6 py-2 rounded-[5px] border transition-all text-sm ${
                    delegateType === "gulf" 
                      ? "bg-[#20744c] text-white border-[#20744c]" 
                      : "bg-white text-gray-600 border-gray-300"
                  }`}
                  onClick={() => setDelegateType("gulf")}
                >
                  مواطن خليجي
                </button>
              </div>

              <div className="mb-4">
                <label className="block mb-1 text-sm text-gray-600">أسم المفوض</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#027d95] bg-white"
                  placeholder="أكتب أسم المفوض هنا..."
                  value={delegateName}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^[\u0600-\u06FF\s]+$/.test(val)) {
                      setDelegateName(val);
                      if (val.trim()) setFormErrors(prev => { const n = {...prev}; delete n.delegateName; return n; });
                    }
                  }}
                />
                {formErrors.delegateName && <p className="text-red-500 text-xs mt-1">{formErrors.delegateName}</p>}
              </div>

              <div className="mb-4">
                <label className="block mb-1 text-sm text-gray-600">رقم الجوال</label>
                <div className={`flex items-center border rounded bg-white ${delegatePhoneError ? 'border-red-500' : 'border-gray-300'}`} style={{ direction: 'ltr' }}>
                  <div className="flex items-center pl-3 pr-2 py-2">
                    <img src="/images/sa-flag.png" alt="SA" className="w-8 h-5 object-cover rounded-sm" />
                  </div>
                  <input 
                    type="text" 
                    className="flex-1 px-3 py-2 border-0 focus:outline-none focus:ring-0 bg-white"
                    placeholder="أكتب رقم الجوال المفوض هنا..."
                    style={{ direction: 'rtl' }}
                    value={delegatePhone}
                    maxLength={10}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d+$/.test(val)) {
                        if (val.length <= 10) {
                          setDelegatePhone(val);
                          if (val.trim()) setFormErrors(prev => { const n = {...prev}; delete n.delegatePhone; return n; });
                          const validPrefixes = ['050','053','054','055','056','057','058','059'];
                          if (val === '') {
                            setDelegatePhoneError('');
                          } else if (val.length >= 3) {
                            const prefix = val.substring(0, 3);
                            if (!validPrefixes.includes(prefix)) {
                              setDelegatePhoneError('رقم الجوال يجب أن يبدأ بـ 050, 053, 054, 055, 056, 057, 058, أو 059');
                            } else {
                              setDelegatePhoneError('');
                            }
                          } else if (val.length >= 1 && val[0] !== '0') {
                            setDelegatePhoneError('رقم الجوال يجب أن يبدأ بـ 05');
                          } else if (val.length >= 2 && val[1] !== '5') {
                            setDelegatePhoneError('رقم الجوال يجب أن يبدأ بـ 05');
                          } else {
                            setDelegatePhoneError('');
                          }
                        }
                      }
                    }}
                  />
                </div>
                {delegatePhoneError && <p className="text-red-500 text-xs mt-1">{delegatePhoneError}</p>}
                {!delegatePhoneError && formErrors.delegatePhone && <p className="text-red-500 text-xs mt-1">{formErrors.delegatePhone}</p>}
              </div>

              <div className="mb-4">
                <label className="block mb-1 text-sm text-gray-600">جنسية المفوض</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#027d95] bg-white"
                  value={delegateNationality}
                  onChange={(e) => { setDelegateNationality(e.target.value); if (e.target.value) setFormErrors(prev => { const n = {...prev}; delete n.delegateNationality; return n; }); }}
                >
                  <option value="">أختر الجنسية</option>
                  <option value="السعودية">السعودية</option>
                  <option value="الإمارات">الإمارات</option>
                  <option value="البحرين">البحرين</option>
                  <option value="الكويت">الكويت</option>
                  <option value="عمان">عمان</option>
                  <option value="قطر">قطر</option>
                  <option value="مصر">مصر</option>
                  <option value="الأردن">الأردن</option>
                  <option value="سوريا">سوريا</option>
                  <option value="العراق">العراق</option>
                  <option value="لبنان">لبنان</option>
                  <option value="اليمن">اليمن</option>
                  <option value="الهند">الهند</option>
                  <option value="باكستان">باكستان</option>
                  <option value="بنغلاديش">بنغلاديش</option>
                  <option value="الفلبين">الفلبين</option>
                  <option value="أخرى">أخرى</option>
                </select>
                {formErrors.delegateNationality && <p className="text-red-500 text-xs mt-1">{formErrors.delegateNationality}</p>}
              </div>

              <div className="mb-4">
                <label className="block mb-1 text-sm text-gray-600">رقم الهوية الوطنية / الاقامة المفوض</label>
                <input 
                  type="text" 
                  className={`w-full px-3 py-2 border rounded focus:outline-none bg-white ${delegateIdError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#027d95]'}`}
                  placeholder="أكتب رقم الهوية الوطنية / الاقامة المفوض هنا..."
                  value={delegateIdNumber}
                  maxLength={10}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d+$/.test(val)) {
                      if (val.length <= 10) {
                        setDelegateIdNumber(val);
                        if (val.trim()) setFormErrors(prev => { const n = {...prev}; delete n.delegateIdNumber; return n; });
                        if (val === '') {
                          setDelegateIdError('');
                        } else if (val.length === 10) {
                          if (val[0] !== '1' && val[0] !== '2') {
                            setDelegateIdError('رقم الهوية يجب أن يبدأ بـ 1 أو 2');
                          } else if (!validateSaudiId(val)) {
                            setDelegateIdError('رقم الهوية / الإقامة غير صحيح');
                          } else {
                            setDelegateIdError('');
                          }
                        } else if (val.length > 0 && val.length < 10) {
                          if (val[0] !== '1' && val[0] !== '2') {
                            setDelegateIdError('رقم الهوية يجب أن يبدأ بـ 1 أو 2');
                          } else {
                            setDelegateIdError('');
                          }
                        }
                      }
                    }
                  }}
                />
                {delegateIdError && <p className="text-red-500 text-xs mt-1">{delegateIdError}</p>}
                {!delegateIdError && formErrors.delegateIdNumber && <p className="text-red-500 text-xs mt-1">{formErrors.delegateIdNumber}</p>}
              </div>

              <div className="mb-4">
                <label className="block mb-1 text-sm text-gray-600">تاريخ ميلاد المفوض</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#027d95] bg-white" style={{ maxWidth: '100%', boxSizing: 'border-box', WebkitAppearance: 'none' }}
                  value={delegateBirthDate}
                  onChange={(e) => { setDelegateBirthDate(e.target.value); if (e.target.value) setFormErrors(prev => { const n = {...prev}; delete n.delegateBirthDate; return n; }); }}
                />
                {formErrors.delegateBirthDate && <p className="text-red-500 text-xs mt-1">{formErrors.delegateBirthDate}</p>}
              </div>

              <div className="flex items-start gap-3 mt-4">
                <input 
                  type="checkbox" 
                  className="w-[20px] h-[20px] min-w-[20px] mt-1 accent-[#20744c]"
                  checked={delegateConsent}
                  onChange={(e) => { setDelegateConsent(e.target.checked); if (e.target.checked) setFormErrors(prev => { const n = {...prev}; delete n.delegateConsent; return n; }); }}
                />
                <label className="text-gray-600 text-sm leading-relaxed">
                  أوافق على أن خدمة التفويض تقتصر على إعطاء المفوض الصلاحية بزيارة وإجراء الفحص الفني الدوري للمركبة المفوض عنها
                </label>
              </div>
              {formErrors.delegateConsent && <p className="text-red-500 text-xs mt-1">{formErrors.delegateConsent}</p>}
            </div>
          )}

          {/* Vehicle Information */}
          <h5 className="font-semibold mb-4 mt-8" style={{ color: '#233f48' }}>معلومات المركبة</h5>
          
          <label className="block mb-2" style={{ color: '#3d3e3e', textShadow: '#000000 1px 0 1px' }}>
            اختر حالة المركبة<span className="text-red-500">*</span>
          </label>
          
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            <button 
              type="button"
           className={`px-4 py-2 min-w-[200px] rounded-[5px] border transition-all ${
                vehicleType === "license" 
                  ? "bg-white border-[#1e9b3b] shadow-[0px_1px_5px_#1e9b3b]" 
                  : "bg-gray-100 border-gray-300"
              }`}
              onClick={() => setVehicleType("license")}
            >
              تحمل رخصة سير
            </button>
            <button 
              type="button"
              className={`px-4 py-2 min-w-[200px] rounded-[5px] border transition-all ${
                vehicleType === "customs"                 ? "bg-white border-[#1e9b3b] shadow-[0px_1px_5px_#1e9b3b]" 
                  : "bg-gray-100 border-gray-300"
              }`}
              onClick={() => setVehicleType("customs")}
            >
              تحمل بطاقة جمركية
            </button>
          </div>

          {vehicleType === "license" && (
            <div className="mb-6">
              <div className="mb-4">
                <label className="block mb-1 text-sm">بلد التسجيل<span className="text-red-500">*</span></label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  value={countryReg}
                  onChange={(e) => setCountryReg(e.target.value)}
                >
                  <option value="السعودية">السعودية</option>
                  <option value="الإمارات">الإمارات</option>
                  <option value="مصر">مصر</option>
                  <option value="الأردن">الأردن</option>
                  <option value="سوريا">سوريا</option>
                  <option value="عمان">عمان</option>
                  <option value="الكويت">الكويت</option>
                  <option value="العراق">العراق</option>
                  <option value="البحرين">البحرين</option>
                  <option value="قطر">قطر</option>
                </select>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="w-full md:w-1/2">
                  <label className="block mb-1 text-sm">رقم اللوحة<span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    <select 
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      value={plateLetter1}
                      onChange={(e) => { setPlateLetter1(e.target.value); if (e.target.value !== '-') setFormErrors(prev => { const n = {...prev}; delete n.plateLetter1; return n; }); }}
                    >
                      {letterOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.value === "-" ? "- اختر -" : opt.value}</option>
                      ))}
                    </select>
                    <select 
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      value={plateLetter2}
                      onChange={(e) => { setPlateLetter2(e.target.value); if (e.target.value !== '-') setFormErrors(prev => { const n = {...prev}; delete n.plateLetter2; return n; }); }}
                    >
                      {letterOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.value === "-" ? "- اختر -" : opt.value}</option>
                      ))}
                    </select>
                    <select 
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      value={plateLetter3}
                      onChange={(e) => { setPlateLetter3(e.target.value); if (e.target.value !== '-') setFormErrors(prev => { const n = {...prev}; delete n.plateLetter3; return n; }); }}
                    >
                      {letterOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.value === "-" ? "- اختر -" : opt.value}</option>
                      ))}
                    </select>
                    <input 
                      type="text" 
                      className="px-2 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 w-32 text-sm placeholder:text-[14px]"
                      placeholder="أدخل الأرقام"
                      maxLength={4}
                      value={plateNumber}
                      onChange={(e) => { setPlateNumber(e.target.value.replace(/\D/g, "")); if (e.target.value.trim()) setFormErrors(prev => { const n = {...prev}; delete n.plateNumber; return n; }); }}
                    />
                  </div>
                </div>

                {/* Plate Preview */}
                <div className="flex justify-center items-center">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ 
                      width: '200px', 
                      height: '80px',
                      boxShadow: '0px 2px 14px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <div 
                      className="h-full w-full rounded-lg flex"
                      style={{ 
                        backgroundColor: '#f1f1f1',
                        border: '1px solid black',
                        paddingRight: '17px',
                      }}
                    >
                      <div className="flex flex-row-reverse h-full w-full" style={{ borderRight: '1px solid black' }}>
                        {/* Numbers */}
                        <div className="w-1/2 flex flex-col h-full" style={{ borderRight: '1px solid black', direction: 'ltr' }}>
                          <div className="h-1/2 flex justify-center items-center gap-1 font-bold text-lg" style={{ borderBottom: '1px solid black' }}>
                            {toArabicDigits(formatPlateNumber(plateNumber)).split("").map((n, i) => <span key={i}>{n}</span>)}
                          </div>
                          <div className="h-1/2 flex justify-center items-center gap-1 font-bold text-lg">
                            {formatPlateNumber(plateNumber).split("").map((n, i) => <span key={i}>{n}</span>)}
                          </div>
                        </div>
                        {/* Letters */}
                        <div className="w-1/2 flex flex-col h-full">
                          <div className="h-1/2 flex justify-center items-center gap-2 font-bold text-lg" style={{ borderBottom: '1px solid black' }}>
                            <span>{getLetter(plateLetter1, "ar")}</span>
                            <span>{getLetter(plateLetter2, "ar")}</span>
                            <span>{getLetter(plateLetter3, "ar")}</span>
                          </div>
                          <div className="h-1/2 flex justify-center items-center gap-2 font-bold text-lg">
                            <span>{getLetter(plateLetter1, "en")}</span>
                            <span>{getLetter(plateLetter2, "en")}</span>
                            <span>{getLetter(plateLetter3, "en")}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {vehicleType === "customs" && (
            <div className="mb-6">
              <label className="block mb-1 text-sm">رقم البطاقة الجمركية<span className="text-red-500">*</span></label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                value={customsId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^[a-zA-Z0-9]*$/.test(val)) {
                    setCustomsId(val);
                    if (val.trim()) setFormErrors(prev => { const n = {...prev}; delete n.customsId; return n; });
                  }
                }}
              />
              {formErrors.customsId && <p className="text-red-500 text-xs mt-1">{formErrors.customsId}</p>}
            </div>
          )}

          <div className="mb-4">
            <label className="block mb-1 text-sm">نوع التسجيل<span className="text-red-500">*</span></label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              value={registrationType}
              onChange={(e) => { setRegistrationType(e.target.value); if (e.target.value) setFormErrors(prev => { const n = {...prev}; delete n.registrationType; return n; }); }}
            >
              <option value="">أختر نوع التسجيل</option>
              <option value="خصوصي">خصوصي</option>
              <option value="نقل عام">نقل عام</option>
              <option value="نقل خاص">نقل خاص</option>
              <option value="مقطورة">مقطورة</option>
              <option value="دراجة نارية">دراجة نارية</option>
              <option value="مركبة أجرة">مركبة أجرة</option>
              <option value="تصدير">تصدير</option>
              <option value="دراجة نارية ترفيهيه">دراجة نارية ترفيهيه</option>
              <option value="هيئة دبلوماسية">هيئة دبلوماسية</option>
              <option value="حافلة خاصة">حافلة خاصة</option>
              <option value="مؤقتة">مؤقتة</option>
              <option value="مركبة أشغال عامة">مركبة أشغال عامة</option>
            </select>
            {formErrors.registrationType && <p className="text-red-500 text-xs mt-1">{formErrors.registrationType}</p>}
          </div>

          {/* Service Center */}
          <h5 className="font-semibold mb-4 mt-8" style={{ color: '#233f48' }}>مركز الخدمة</h5>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1 text-sm">نوع المركبة<span className="text-red-500">*</span></label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                value={vehicleWheels}
                onChange={(e) => setVehicleWheels(e.target.value)}
              >
                <option value="سيارة خاصة">سيارة خاصة</option>
                <option value="مركبة نقل خفيفة خاصة">مركبة نقل خفيفة خاصة</option>
                <option value="نقل ثقيل">نقل ثقيل</option>
                <option value="حافلة خفيفة">حافلة خفيفة</option>
                <option value="مركبة نقل خفيفة">مركبة نقل خفيفة</option>
                <option value="نقل متوسط">نقل متوسط</option>
                <option value="حافلة كبيرة">حافلة كبيرة</option>
                <option value="الدراجات ثنائية العجلات">الدراجات ثنائية العجلات</option>
                <option value="مركبات أشغال عامة">مركبات أشغال عامة</option>
                <option value="دراجة ثلاثية او رباعية العجلات">دراجة ثلاثية او رباعية العجلات</option>
                <option value="مقطورة ثقيلة">مقطورة ثقيلة</option>
                <option value="سيارات الأجرة">سيارات الأجرة</option>
                <option value="سيارات التأجير">سيارات التأجير</option>
                <option value="نصف مقطورة ثقيلة">نصف مقطورة ثقيلة</option>
                <option value="حافلة متوسطة">حافلة متوسطة</option>
                <option value="مقطورة خفيفة">مقطورة خفيفة</option>
                <option value="نصف مقطورة خفيفة">نصف مقطورة خفيفة</option>
                <option value="نصف مقطورة خفيفة خاصة">نصف مقطورة خفيفة خاصة</option>
                <option value="مقطورة خفيفة خاصة">مقطورة خفيفة خاصة</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm">نوع خدمة الفحص<span className="text-red-500">*</span></label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
              >
                <option value="خدمة الفحص الدوري">خدمة الفحص الدوري</option>
                <option value="خدمة إعادة الفحص">خدمة إعادة الفحص</option>
              </select>

            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1 text-sm">المنطقة<span className="text-red-500">*</span></label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                value={region}
                onChange={(e) => { setRegion(e.target.value); setInspectionCenter(""); if (e.target.value) setFormErrors(prev => { const n = {...prev}; delete n.region; return n; }); }}
              >
                {regions.map((r, i) => (
                  <option key={i} value={i === 0 ? "" : r}>{r}</option>
                ))}
              </select>
              {formErrors.region && <p className="text-red-500 text-xs mt-1">{formErrors.region}</p>}
            </div>
            <div>
              <label className="block mb-1 text-sm">مركز الفحص<span className="text-red-500">*</span></label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                value={inspectionCenter}
                onChange={(e) => { setInspectionCenter(e.target.value); if (e.target.value) setFormErrors(prev => { const n = {...prev}; delete n.inspectionCenter; return n; }); }}
              >
                <option value="">اختر مركز الفحص</option>
                {region && centersByRegion[region] && centersByRegion[region].map((center, i) => (
                  <option key={i} value={center}>{center}</option>
                ))}
              </select>
              {formErrors.inspectionCenter && <p className="text-red-500 text-xs mt-1">{formErrors.inspectionCenter}</p>}
            </div>
          </div>

          {/* Map */}
          <div className="mb-6">
            <div 
              ref={mapRef} 
              className="w-full rounded-lg border border-gray-300" 
              style={{ height: '300px', zIndex: 0 }}
            />
          </div>

          {/* Appointment */}
          <h5 className="font-semibold mb-4 mt-8" style={{ color: '#233f48' }}>موعد الخدمة</h5>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1 text-sm">تاريخ الفحص<span className="text-red-500">*</span></label>
              <input 
                type="date" 
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 text-sm">وقت الفحص<span className="text-red-500">*</span></label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
              >
                {timeSlots.map((t, i) => (
                  <option key={i} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-red-600 mb-6 px-4 py-3 rounded" style={{ backgroundColor: '#fff5f5' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 min-w-[24px] text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span>الحضور على الموعد يسهم في سرعة وجودة الخدمة وفي حالة عدم الحضور، لن يسمح بحجز اخر إلا بعد 48 ساعة وحسب الإوقات المحددة</span>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button 
              type="button"
              className="px-8 py-2 text-white rounded-[5px] min-w-[150px]"
              style={{ backgroundColor: '#20744c' }}
              onClick={handleSubmit}
            >
              التالي
            </button>
          </div>

        </form>
      </section>

      {/* Footer */}
      <footer className="text-white pt-8 md:pt-12 pb-6" style={{ backgroundColor: '#146494' }}>
        <div className="container mx-auto px-4 lg:px-8">
          {/* Top Section - ORIGINAL desktop layout restored */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            {/* Right side: Logo + Phone + Stores + Payment */}
            <div className="flex flex-col md:flex-row gap-6 md:items-start">
              {/* BCare Logo + Phone */}
              <div className="text-right flex-shrink-0">
                <img src="/images/bcare/Bcarelogo.svg" alt="بي كير" className="h-10 mb-3 brightness-0 invert" />
                <p className="text-white text-lg font-bold mb-3" dir="ltr">☎ 8001180044</p>
                {/* Payment Methods */}
                <img src="/images/bcare/PaymentMethods1.svg" alt="طرق الدفع" className="h-8 mt-3" />
              </div>
              {/* App Stores stacked on desktop, row on mobile */}
              <div className="flex flex-row md:flex-col gap-2 flex-shrink-0">
                <img src="/images/bcare/googlestore.svg" alt="Google Play" className="h-9 md:h-10 w-fit" />
                <img src="/images/bcare/applestore.svg" alt="App Store" className="h-9 md:h-10 w-fit" />
                <img src="/images/bcare/huaweistore.svg" alt="AppGallery" className="h-9 md:h-10 w-fit" />
              </div>
            </div>

            {/* 4 Text Columns */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 flex-1">
              {/* عن بي كير */}
              <div className="text-right">
                <h3 className="font-bold mb-3 md:mb-4 text-sm md:text-base">عن بي كير</h3>
                <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-white/80">
                  <li><a href="#" className="hover:text-white hover:underline">خصومات وريف</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">سياسة الخصوصية</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">الشروط والأحكام</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">وظائف</a></li>
                </ul>
              </div>

              {/* منتجاتنا */}
              <div className="text-right">
                <h3 className="font-bold mb-3 md:mb-4 text-sm md:text-base">منتجاتنا</h3>
                <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-white/80">
                  <li><a href="#" className="hover:text-white hover:underline">تأمين المركبات</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">التأمين الطبي</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">تأمين السفر</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">تأمين الأخطاء الطبية</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">تأمين العمالة المنزلية</a></li>
                </ul>
              </div>

              {/* الدعم الفني */}
              <div className="text-right">
                <h3 className="font-bold mb-3 md:mb-4 text-sm md:text-base">الدعم الفني</h3>
                <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-white/80">
                  <li><a href="#" className="hover:text-white hover:underline">المدونة</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">إلغاء وثيقتك</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">رفع تذكرة</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">اطبع وثيقتك</a></li>
                </ul>
              </div>

              {/* روابط مهمة */}
              <div className="text-right">
                <h3 className="font-bold mb-3 md:mb-4 text-sm md:text-base">روابط مهمة</h3>
                <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-white/80">
                  <li><a href="#" className="hover:text-white hover:underline">هيئة التأمين</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">طريقة رفع شكوى لهيئة التأمين</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">قواعد ولوائح هيئة التأمين</a></li>
                  <li><a href="#" className="hover:text-white hover:underline">شهادة ضريبة القيمة المضافة</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom: white line, social icons left, copyright right */}
          <div className="border-t border-white/30 md:border-white pt-4 flex flex-col-reverse md:flex-row items-center justify-between gap-3 md:gap-0">
            {/* Copyright - Left */}
            <p className="text-[10px] md:text-sm text-white/80 text-center md:text-right mb-0 md:mb-0">
              2026 © جميع الحقوق محفوظة، شركة عناية الوسيط لوساطة التأمين
            </p>
            {/* Social Icons - Right */}
            <div className="flex gap-2 md:gap-3">
              <a href="#" className="w-8 h-8 md:w-9 md:h-9 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25">
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 md:w-9 md:h-9 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25">
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 md:w-9 md:h-9 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25">
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 md:w-9 md:h-9 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25">
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 md:w-9 md:h-9 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25">
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 md:w-9 md:h-9 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25">
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
