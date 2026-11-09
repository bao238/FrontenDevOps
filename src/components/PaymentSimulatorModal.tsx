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
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header cổng thanh toán theo nhận diện thương hiệu */}
        <div
          className={`px-6 py-4 flex items-center justify-between text-white ${
            isVnPay
              ? "bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700"
              : "bg-gradient-to-r from-[#a50064] to-[#d82d8b]"
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-lg">
              {isVnPay ? "MB" : "M"}
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg flex items-center space-x-2">
                <span>{isVnPay ? "Cổng Thanh Toán VietQR / MBBank" : "Cổng Thanh Toán Ví MoMo"}</span>
                <span className="text-[10px] bg-white/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                  Napas 247
                </span>
              </h3>
              <p className="text-xs text-white/80">Quét mã bằng ứng dụng mọi ngân hàng tại Việt Nam</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Thân Modal: Thông tin giao dịch & Mã QR MBBank */}
        <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Hộp đếm ngược thời gian thanh toán */}
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200/80 rounded-2xl px-4 py-2.5 text-xs text-amber-900">
            <div className="flex items-center space-x-2 font-medium">
              <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>Giao dịch hết hạn sau:</span>
            </div>
            <span className="font-mono font-bold text-amber-700 text-sm">
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Khung quét mã QR */}
          <div className="flex flex-col items-center justify-center p-3 sm:p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            {isVnPay && (
              <div className="flex items-center justify-center space-x-1.5 mb-3 bg-slate-200/70 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setQrMode("card")}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    qrMode === "card"
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Mã QR MBBank (Gốc)
                </button>
                <button
                  type="button"
                  onClick={() => setQrMode("dynamic")}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    qrMode === "dynamic"
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  QR Tự Điền Số Tiền
                </button>
              </div>
            )}

            <div className="relative p-2.5 bg-white rounded-2xl shadow-sm border border-slate-200">
              {isVnPay ? (
                qrMode === "card" ? (
                  <img
                    src="/images/vietqr-caodinhbao.jpg"
                    alt="Mã QR MBBank CAO DINH BAO 0347934359"
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain mx-auto rounded-xl"
                  />
                ) : (
                  <img
                    src={qrDynamicUrl}
                    alt="VietQR Tự động"
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain mx-auto"
                  />
                )
              ) : (
                <div className="p-4 flex flex-col items-center">
                  <QrCode className="w-40 h-40 text-[#a50064]" />
                  <span className="text-xs font-bold text-[#a50064] mt-2">Mã QR Ví MoMo</span>
                </div>
              )}
            </div>

            <p className="mt-2.5 text-xs text-slate-500 flex items-center space-x-1.5 font-medium">
              <Smartphone className="w-3.5 h-3.5 text-slate-600" />
              <span>
                Mở App {isVnPay ? "Ngân hàng bất kỳ (MBBank, VCB, Techcombank...)" : "Ví MoMo"} để quét mã
              </span>
            </p>
          </div>

          {/* Chi tiết hóa đơn thanh toán */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-xs text-slate-700 border border-slate-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
              <span className="text-slate-500">Đơn vị thụ hưởng:</span>
              <span className="font-bold text-slate-900 text-right">
                {isVnPay ? "MBBank - CAO DINH BAO" : "VÍ MOMO - BOOKSTORE"}
              </span>
            </div>

            {isVnPay && (
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                <span className="text-slate-500">Số tài khoản:</span>
                <div className="flex items-center space-x-1.5">
                  <span className="font-mono font-bold text-blue-600">0347934359</span>
                  <button
                    type="button"
                    onClick={handleCopyAcc}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors cursor-pointer"
                    title="Sao chép số tài khoản"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {copiedAcc && <span className="text-[10px] text-emerald-600 font-bold">Đã chép!</span>}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
              <span className="text-slate-500">Mã đơn hàng (Nội dung CK):</span>
              <div className="flex items-center space-x-1.5">
                <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {orderId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors cursor-pointer"
                  title="Sao chép mã đơn hàng"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {copied && <span className="text-[10px] text-emerald-600 font-bold">Đã chép!</span>}
              </div>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-500 text-sm font-medium">Số tiền thanh toán:</span>
              <span className="text-lg font-black text-red-600">
                {amount > 0 ? amount.toLocaleString("vi-VN") : "0"} đ
              </span>
            </div>
          </div>

          {/* Thẻ gợi ý các ngân hàng hỗ trợ */}
          {isVnPay && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5 text-[11px] text-slate-500">
              <span className="text-slate-400">Hỗ trợ:</span>
              <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">MB Bank</span>
              <span className="bg-slate-100 font-semibold px-2 py-0.5 rounded text-slate-700">Vietcombank</span>
              <span className="bg-slate-100 font-semibold px-2 py-0.5 rounded text-slate-700">Techcombank</span>
              <span className="bg-slate-100 font-semibold px-2 py-0.5 rounded text-slate-700">BIDV</span>
              <span className="bg-slate-100 font-semibold px-2 py-0.5 rounded text-slate-700">Agribank</span>
            </div>
          )}

          {/* Nút hành động xác nhận đã thanh toán */}
          <div className="pt-1 space-y-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleSimulateSuccess}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-white text-sm shadow-lg flex items-center justify-center space-x-2 transition-all transform active:scale-98 cursor-pointer ${
                isVnPay
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25"
                  : "bg-[#a50064] hover:bg-[#8b0054] shadow-pink-500/25"
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xác thực giao dịch...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Xác nhận đã quét mã &amp; thanh toán thành công</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Hủy bỏ giao dịch / Đổi phương thức khác
            </button>
          </div>
        </div>

        {/* Chân Modal: Cam kết bảo mật */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-center space-x-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Bảo mật chuẩn PCI-DSS &amp; mã hóa SSL 256-bit an toàn</span>
        </div>
      </div>
    </div>
  );
}
