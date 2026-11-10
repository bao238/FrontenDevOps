import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  Clock,
  ShieldCheck,
  QrCode,
  Copy,
  Smartphone,
  ExternalLink,
  CreditCard
} from "lucide-react";

// Định nghĩa Props tiếp nhận cho Modal Giả lập Thanh toán
interface PaymentSimulatorModalProps {
  isOpen: boolean; // Trạng thái hiển thị modal
  method: "vnpay" | "momo"; // Phương thức: VNPAY hoặc Ví MoMo
  amount: number; // Tổng số tiền cần thanh toán (VNĐ)
  orderId: string; // Mã đơn hàng (ví dụ: DB-123456)
  onClose: () => void; // Hàm đóng modal / Hủy giao dịch
  onSuccess: () => void; // Hàm kích hoạt khi thanh toán thành công
}

export default function PaymentSimulatorModal({
  isOpen,
  method,
  amount,
  orderId,
  onClose,
  onSuccess,
}: PaymentSimulatorModalProps) {
  // Đếm ngược thời gian thanh toán (15 phút = 900 giây)
  const [timeLeft, setTimeLeft] = useState<number>(900);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedAcc, setCopiedAcc] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  // Cho phép chuyển đổi linh hoạt giữa Thẻ QR MBBank gốc và QR động có sẵn số tiền
  const [qrMode, setQrMode] = useState<"card" | "dynamic">("card");

  // Hiệu ứng đếm ngược thời gian phiên giao dịch
  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(900);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  // Định dạng thời gian mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Xử lý sao chép mã đơn hàng vào bộ nhớ tạm
  const handleCopyCode = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Sao chép số tài khoản
  const handleCopyAcc = () => {
    navigator.clipboard.writeText("0347934359");
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2000);
  };

  // Giả lập tiến trình xác thực thanh toán thành công qua cổng điện tử
  const handleSimulateSuccess = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess();
    }, 1200);
  };

  const isVnPay = method === "vnpay";

  // URL sinh mã QR động tự động điền sẵn số tiền và nội dung chuyển khoản cho MBBank
  const qrDynamicUrl = `https://img.vietqr.io/image/MB-0347934359-compact2.png?amount=${Math.round(
    amount
  )}&addInfo=${encodeURIComponent(orderId)}&accountName=${encodeURIComponent(
    "CAO DINH BAO"
  )}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-200">
        {/* Header cổng thanh toán theo nhận diện thương hiệu thu gọn */}
        <div
          className={`px-4 sm:px-5 py-3 text-white relative shrink-0 ${
            isVnPay
              ? "bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700"
              : "bg-gradient-to-r from-[#a50064] to-[#d82d8b]"
          }`}
        >
          <div className="flex items-center space-x-2.5 pr-8">
            {/* Logo đại diện MBBank hoặc MoMo */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-base shrink-0 shadow-inner">
              {isVnPay ? "MB" : "M"}
            </div>
            
            {/* Tên cổng thanh toán và badge Napas 247 được cố định kích thước */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <h3 className="font-extrabold text-sm sm:text-base leading-tight tracking-tight text-white drop-shadow-xs truncate">
                  {isVnPay ? "Cổng VietQR / MBBank" : "Cổng Ví MoMo"}
                </h3>
                {isVnPay && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/25 border border-white/35 text-[9px] font-extrabold tracking-wider uppercase text-white shadow-xs whitespace-nowrap shrink-0">
                    Napas 247
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/85 mt-0.5 font-medium truncate">
                {isVnPay
                  ? "Chuyển khoản 24/7 qua mọi App Ngân hàng"
                  : "Quét thanh toán tức thì qua App MoMo"}
              </p>
            </div>
          </div>

          {/* Nút đóng Modal đặt ở góc trên bên phải */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center transition-all cursor-pointer border border-white/20"
            title="Đóng cửa sổ thanh toán"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Thân Modal: Thông tin giao dịch & Mã QR thu gọn với thanh cuộn custom-scrollbar */}
        <div className="p-3.5 sm:p-4 space-y-2.5 overflow-y-auto custom-scrollbar text-xs">
          {/* Hộp đếm ngược thời gian thanh toán */}
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-1.5 text-xs text-amber-900 shadow-xs">
            <div className="flex items-center space-x-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>Giao dịch hết hạn sau:</span>
            </div>
            <span className="font-mono font-bold text-amber-700 text-xs sm:text-sm">
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Khung quét mã QR */}
          <div className="flex flex-col items-center justify-center p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80">
            {isVnPay && (
              /* Bộ nút chuyển đổi tab xem: chia đều 50% - 50% cân đối gọn gàng */
              <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-200/80 rounded-lg w-full max-w-xs mx-auto mb-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setQrMode("card")}
                  className={`w-full py-1 px-1.5 rounded-md font-bold text-center transition-all cursor-pointer ${
                    qrMode === "card"
                      ? "bg-white text-blue-700 shadow-xs ring-1 ring-black/5"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                  }`}
                >
                  Mã QR MBBank (Gốc)
                </button>
                <button
                  type="button"
                  onClick={() => setQrMode("dynamic")}
                  className={`w-full py-1 px-1.5 rounded-md font-bold text-center transition-all cursor-pointer ${
                    qrMode === "dynamic"
                      ? "bg-white text-blue-700 shadow-xs ring-1 ring-black/5"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                  }`}
                >
                  QR Tự Điền Số Tiền
                </button>
              </div>
            )}

            <div className="relative p-2 bg-white rounded-xl shadow-xs border border-slate-200">
              {isVnPay ? (
                qrMode === "card" ? (
                  <img
                    src="/images/vietqr-caodinhbao.jpg"
                    alt="Mã QR MBBank CAO DINH BAO 0347934359"
                    className="w-36 h-36 sm:w-40 sm:h-40 object-contain mx-auto rounded-lg"
                  />
                ) : (
                  <img
                    src={qrDynamicUrl}
                    alt="VietQR Tự động"
                    className="w-36 h-36 sm:w-40 sm:h-40 object-contain mx-auto"
                  />
                )
              ) : (
                <div className="p-3 flex flex-col items-center">
                  <QrCode className="w-32 h-32 text-[#a50064]" />
                  <span className="text-[11px] font-bold text-[#a50064] mt-1.5">Mã QR Ví MoMo</span>
                </div>
              )}
            </div>

            <p className="mt-2 text-[11px] text-slate-500 flex items-center space-x-1.5 font-medium text-center">
              <Smartphone className="w-3 h-3 text-slate-600 shrink-0" />
              <span>
                Mở App {isVnPay ? "Ngân hàng bất kỳ" : "Ví MoMo"} để quét mã
              </span>
            </p>
          </div>

          {/* Chi tiết hóa đơn thanh toán */}
          <div className="bg-slate-50/90 rounded-xl p-2.5 sm:p-3 space-y-1.5 text-[11.5px] text-slate-700 border border-slate-200/80">
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60">
              <span className="text-slate-500">Đơn vị thụ hưởng:</span>
              <span className="font-bold text-slate-900 text-right">
                {isVnPay ? "MBBank - CAO DINH BAO" : "VÍ MOMO - BOOKSTORE"}
              </span>
            </div>

            {isVnPay && (
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60">
                <span className="text-slate-500">Số tài khoản:</span>
                <div className="flex items-center space-x-1.5">
                  <span className="font-mono font-bold text-blue-600 text-xs sm:text-sm">0347934359</span>
                  <button
                    type="button"
                    onClick={handleCopyAcc}
                    className="p-0.5 hover:bg-slate-200 rounded text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                    title="Sao chép số tài khoản"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {copiedAcc && <span className="text-[10px] text-emerald-600 font-bold">Đã chép!</span>}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60">
              <span className="text-slate-500">Mã đơn hàng (Nội dung CK):</span>
              <div className="flex items-center space-x-1.5">
                <span className="font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 text-xs">
                  {orderId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-0.5 hover:bg-slate-200 rounded text-slate-500 hover:text-purple-600 transition-colors cursor-pointer"
                  title="Sao chép mã đơn hàng"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {copied && <span className="text-[10px] text-emerald-600 font-bold">Đã chép!</span>}
              </div>
            </div>

            <div className="flex justify-between items-center pt-0.5">
              <span className="text-slate-500 text-xs font-medium">Số tiền thanh toán:</span>
              <span className="text-base sm:text-lg font-black text-red-600">
                {amount > 0 ? amount.toLocaleString("vi-VN") : "0"} đ
              </span>
            </div>
          </div>

          {/* Thẻ gợi ý các ngân hàng hỗ trợ */}
          {isVnPay && (
            <div className="flex flex-wrap items-center justify-center gap-1 text-[10px] text-slate-500">
              <span className="text-slate-400">Hỗ trợ:</span>
              <span className="bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded">MB Bank</span>
              <span className="bg-slate-100 font-semibold px-1.5 py-0.5 rounded text-slate-700">Vietcombank</span>
              <span className="bg-slate-100 font-semibold px-1.5 py-0.5 rounded text-slate-700">Techcombank</span>
              <span className="bg-slate-100 font-semibold px-1.5 py-0.5 rounded text-slate-700">BIDV</span>
              <span className="bg-slate-100 font-semibold px-1.5 py-0.5 rounded text-slate-700">Agribank</span>
            </div>
          )}

          {/* Nút hành động xác nhận đã thanh toán */}
          <div className="pt-0.5 space-y-1.5">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleSimulateSuccess}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-white text-xs sm:text-sm shadow-md flex items-center justify-center space-x-1.5 transition-all transform active:scale-98 cursor-pointer ${
                isVnPay
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                  : "bg-[#a50064] hover:bg-[#8b0054] shadow-pink-500/20"
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xác thực giao dịch...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác nhận đã quét mã &amp; thanh toán</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={onClose}
              className="w-full py-1.5 px-3 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy bỏ giao dịch / Đổi phương thức khác
            </button>
          </div>
        </div>

        {/* Chân Modal: Cam kết bảo mật thu gọn */}
        <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex items-center justify-center space-x-1.5 text-[10px] text-slate-500 shrink-0">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>Bảo mật chuẩn PCI-DSS &amp; mã hóa SSL 256-bit an toàn</span>
        </div>
      </div>
    </div>
  );
}
