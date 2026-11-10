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
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 flex flex-col max-h-[94vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Modal thu gọn, cố định ở trên */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-xl">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Thanh Toán VietQR
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[9px] font-bold tracking-wider uppercase whitespace-nowrap shrink-0">
                  Napas 247
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Quét mã QR bằng ứng dụng ngân hàng bất kỳ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đóng modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nội dung thanh toán thu gọn, cuộn mượt mà với custom-scrollbar nếu cần */}
        <div className="p-3.5 sm:p-4 space-y-2.5 overflow-y-auto custom-scrollbar text-xs">
          {/* Khung hiển thị Mã QR */}
          <div className="bg-slate-50/90 p-2.5 sm:p-3 rounded-2xl border border-slate-100 text-center flex flex-col items-center">
            {/* Bộ nút chuyển đổi tab xem: chia đều 50/50, chiều cao gọn */}
            <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-200/80 rounded-lg w-full max-w-xs mx-auto mb-2 text-[11px]">
              <button
                type="button"
                onClick={() => setQrType("card")}
                className={`w-full py-1 px-1.5 rounded-md font-bold text-center transition-all cursor-pointer ${
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
                className={`w-full py-1 px-1.5 rounded-md font-bold text-center transition-all cursor-pointer ${
                  qrType === "dynamic"
                    ? "bg-white text-blue-700 shadow-xs ring-1 ring-black/5"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                }`}
              >
                QR Tự Điền Số Tiền
              </button>
            </div>

            {/* Hiển thị ảnh thẻ QR MBBank hoặc QR động tùy theo tab lựa chọn */}
            <div className="bg-white p-2 rounded-xl shadow-xs border border-slate-200 inline-block mb-1.5">
              {qrType === "card" ? (
                <div className="flex flex-col items-center">
                  <img
                    src="/images/vietqr-caodinhbao.jpg"
                    alt="Mã QR MBBank CAO DINH BAO 0347934359"
                    className="w-36 h-36 sm:w-40 sm:h-40 object-contain mx-auto rounded-lg"
                  />
                  <p className="mt-1 text-[10px] font-medium text-slate-500">
                    MBBank Napas247 - CAO DINH BAO
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <img
                    src={qrUrl}
                    alt="VietQR Tự động điền số tiền"
                    className="w-36 h-36 sm:w-40 sm:h-40 object-contain mx-auto"
                  />
                  <p className="mt-1 text-[10px] font-medium text-slate-500">
                    Quét tự điền {formatVND(totalAmount)}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-1.5 text-slate-500 text-[10.5px]">
              <Clock className="w-3 h-3 text-blue-600 animate-pulse" />
              <span>Hệ thống tự động nhận diện và cập nhật đơn hàng</span>
            </div>
          </div>

          {/* Chi tiết tài khoản nhận tiền */}
          <div className="space-y-1.5 bg-slate-50/80 p-2.5 sm:p-3 rounded-xl border border-slate-100 text-[11.5px]">
            <div className="flex items-center justify-between text-slate-600 py-0.5 border-b border-slate-200/50">
              <span className="text-slate-500">Ngân hàng:</span>
              <strong className="text-slate-800 font-semibold">{BANK_NAME}</strong>
            </div>

            <div className="flex items-center justify-between text-slate-600 py-0.5 border-b border-slate-200/50">
              <span className="text-slate-500">Số tài khoản:</span>
              <div className="flex items-center space-x-1.5">
                <span className="font-mono font-bold text-blue-600 text-xs">{ACCOUNT_NO}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(ACCOUNT_NO, "accountNo")}
                  className="p-0.5 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
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

            <div className="flex items-center justify-between text-slate-600 py-0.5 border-b border-slate-200/50">
              <span className="text-slate-500">Chủ tài khoản:</span>
              <strong className="text-slate-800 font-semibold">{ACCOUNT_NAME}</strong>
            </div>

            <div className="flex items-center justify-between text-slate-600 py-0.5 border-b border-slate-200/50">
              <span className="text-slate-500">Số tiền:</span>
              <div className="flex items-center space-x-1.5">
                <strong className="text-rose-600 font-bold text-sm">
                  {formatVND(totalAmount)}
                </strong>
                <button
                  type="button"
                  onClick={() => handleCopy(String(Math.round(totalAmount)), "amount")}
                  className="p-0.5 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
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

            <div className="flex items-center justify-between text-slate-600 py-0.5">
              <span className="text-slate-500">Nội dung CK:</span>
              <div className="flex items-center space-x-1.5">
                <span className="font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 text-xs">
                  {TRANSFER_CONTENT}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(TRANSFER_CONTENT, "content")}
                  className="p-0.5 text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
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

          {/* Cảnh báo an toàn tinh gọn */}
          <div className="p-2 bg-amber-50/90 border border-amber-200 rounded-lg text-amber-800 text-[10.5px] flex items-center space-x-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
            <span>
              Giữ nguyên nội dung CK <strong>{TRANSFER_CONTENT}</strong> để hệ thống tự kích hoạt đơn nhanh nhất.
            </span>
          </div>

          {/* Nút hành động */}
          <div className="flex items-center space-x-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors text-xs cursor-pointer"
            >
              Để Sau / Đóng
            </button>
            <button
              type="button"
              onClick={onConfirmPaid}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5 shadow-xs transition-all text-xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tôi Đã Chuyển Khoản Xong</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
