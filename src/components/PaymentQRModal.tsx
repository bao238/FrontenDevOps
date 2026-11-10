import React, { useState } from "react";
import {
  QrCode,
  Copy,
  Check,
  CheckCircle2,
  X,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Clock
} from "lucide-react";

interface PaymentQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  totalAmount: number;
  customerName: string;
  onConfirmPaid: () => void;
}

export default function PaymentQRModal({
  isOpen,
  onClose,
  orderId,
  totalAmount,
  customerName,
  onConfirmPaid
}: PaymentQRModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  // Cho phép chuyển đổi linh hoạt giữa Thẻ QR MBBank gốc và QR động có sẵn số tiền
  const [qrType, setQrType] = useState<"card" | "dynamic">("card");

  if (!isOpen) return null;

  // Thông tin tài khoản nhận thanh toán chuẩn Napas247 VietQR (MBBank - CAO DINH BAO)
  const BANK_ID = "MB"; // Ngân hàng Quân Đội (MBBank)
  const BANK_NAME = "MBBank (Ngân hàng TMCP Quân Đội)";
  const ACCOUNT_NO = "0347934359";
  const ACCOUNT_NAME = "CAO DINH BAO";
  const TRANSFER_CONTENT = orderId; // Mã đơn hàng (VD: DB-123456 hoặc ORD-123456)

  // URL sinh mã QR động tự động điền sẵn số tiền và nội dung chuyển khoản
  const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${Math.round(
    totalAmount
  )}&addInfo=${encodeURIComponent(TRANSFER_CONTENT)}&accountName=${encodeURIComponent(
    ACCOUNT_NAME
  )}`;

  // Hàm sao chép thông tin vào Clipboard
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Định dạng hiển thị tiền VNĐ
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto custom-scrollbar">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-8">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  Thanh Toán VietQR
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold tracking-wider uppercase whitespace-nowrap shrink-0">
                  Napas 247
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Quét mã QR bằng ứng dụng ngân hàng bất kỳ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung thanh toán */}
        <div className="mt-5 space-y-5 text-xs sm:text-sm">
          {/* Khung hiển thị Mã QR */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center flex flex-col items-center">
            {/* Bộ nút chuyển đổi tab xem: Mã QR MBBank chính thức hoặc QR VietQR tự động chia đều đối xứng 50/50 */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/80 rounded-xl w-full max-w-sm mx-auto mb-3 text-xs">
              <button
                type="button"
                onClick={() => setQrType("card")}
                className={`w-full py-1.5 px-2 rounded-lg font-bold text-center transition-all cursor-pointer ${
                  qrType === "card"
                    ? "bg-white text-blue-700 shadow-xs ring-1 ring-black/5"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                }`}
              >
                Mã QR MBBank (Gốc)
              </button>
              <button
                type="button"
                onClick={() => setQrType("dynamic")}
                className={`w-full py-1.5 px-2 rounded-lg font-bold text-center transition-all cursor-pointer ${
                  qrType === "dynamic"
                    ? "bg-white text-blue-700 shadow-xs ring-1 ring-black/5"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                }`}
              >
                QR Tự Điền Số Tiền
              </button>
            </div>

            {/* Hiển thị ảnh thẻ QR MBBank hoặc QR động tùy theo tab lựa chọn */}
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 inline-block mb-3">
              {qrType === "card" ? (
                <div className="flex flex-col items-center">
                  <img
                    src="/images/vietqr-caodinhbao.jpg"
                    alt="Mã QR MBBank CAO DINH BAO 0347934359"
                    className="w-52 h-52 sm:w-60 sm:h-60 object-contain mx-auto rounded-xl shadow-xs"
                  />
                  <p className="mt-2 text-[11px] font-medium text-slate-500">
                    Mã QR MBBank Napas247 - CAO DINH BAO (0347934359)
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <img
                    src={qrUrl}
                    alt="VietQR Tự động điền số tiền"
                    className="w-52 h-52 sm:w-60 sm:h-60 object-contain mx-auto"
                  />
                  <p className="mt-2 text-[11px] font-medium text-slate-500">
                    Quét để tự điền số tiền {formatVND(totalAmount)}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>Hệ thống tự động nhận diện và cập nhật trạng thái đơn hàng</span>
            </div>
          </div>

          {/* Chi tiết tài khoản nhận tiền */}
          <div className="space-y-2.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between text-slate-600 py-1 border-b border-slate-200/50">
              <span className="text-slate-500">Ngân hàng:</span>
              <strong className="text-slate-800 font-semibold">{BANK_NAME}</strong>
            </div>

            <div className="flex items-center justify-between text-slate-600 py-1 border-b border-slate-200/50">
              <span className="text-slate-500">Số tài khoản:</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-blue-600 text-sm">{ACCOUNT_NO}</span>
                <button
                  onClick={() => handleCopy(ACCOUNT_NO, "accountNo")}
                  className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                  title="Sao chép số tài khoản"
                >
                  {copiedField === "accountNo" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-slate-600 py-1 border-b border-slate-200/50">
              <span className="text-slate-500">Chủ tài khoản:</span>
              <strong className="text-slate-800 font-semibold">{ACCOUNT_NAME}</strong>
            </div>

            <div className="flex items-center justify-between text-slate-600 py-1 border-b border-slate-200/50">
              <span className="text-slate-500">Số tiền cần chuyển:</span>
              <div className="flex items-center space-x-2">
                <strong className="text-rose-600 font-bold text-sm sm:text-base">
                  {formatVND(totalAmount)}
                </strong>
                <button
                  onClick={() => handleCopy(String(Math.round(totalAmount)), "amount")}
                  className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                  title="Sao chép số tiền"
                >
                  {copiedField === "amount" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-slate-600 py-1">
              <span className="text-slate-500">Nội dung chuyển khoản:</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                  {TRANSFER_CONTENT}
                </span>
                <button
                  onClick={() => handleCopy(TRANSFER_CONTENT, "content")}
                  className="p-1 text-slate-400 hover:text-purple-600 transition-colors"
                  title="Sao chép nội dung chuyển khoản"
                >
                  {copiedField === "content" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Cảnh báo an toàn */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              <strong>Lưu ý quan trọng:</strong> Vui lòng giữ nguyên nội dung chuyển khoản{" "}
              <strong>{TRANSFER_CONTENT}</strong> để hệ thống tự động đối soát và kích hoạt đơn hàng nhanh nhất.
            </span>
          </div>

          {/* Nút hành động */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors text-xs sm:text-sm"
            >
              Để Sau / Đóng
            </button>
            <button
              onClick={onConfirmPaid}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center space-x-2 shadow-md shadow-emerald-500/20 transition-all text-xs sm:text-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Tôi Đã Chuyển Khoản Xong</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
