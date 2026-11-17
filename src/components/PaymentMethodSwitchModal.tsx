import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  QrCode,
  Smartphone,
  Banknote,
  ArrowRight,
  ShieldCheck,
  ArrowLeftRight,
  Sparkles
} from "lucide-react";
import { OrderRecord } from "../App";

export type PaymentMethodChoice = "banking" | "vnpay" | "momo" | "cod";

interface PaymentMethodSwitchModalProps {
  isOpen: boolean;
  order: OrderRecord | null;
  onClose: () => void;
  onSelectMethod: (method: PaymentMethodChoice) => void;
}

export default function PaymentMethodSwitchModal({
  isOpen,
  order,
  onClose,
  onSelectMethod,
}: PaymentMethodSwitchModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodChoice>("banking");

  const currentMethodId: PaymentMethodChoice = (() => {
    if (!order) return "cod";
    const pm = (order.paymentMethod || "").toLowerCase();
    if (pm.includes("vnpay")) return "vnpay";
    if (pm.includes("momo")) return "momo";
    if (pm.includes("qr") || pm.includes("banking") || pm.includes("khoản")) return "banking";
    return "cod";
  })();

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const currentMethodFormatted = (() => {
    if (!order) return "Tiền mặt (COD)";
    const pm = (order.paymentMethod || "").toLowerCase();
    if (pm.includes("cod") || pm.includes("nhận hàng") || pm.includes("tiền mặt")) return "Tiền mặt (COD)";
    if (pm.includes("qr") || pm.includes("banking") || pm.includes("khoản")) return "Chuyển khoản (VietQR)";
    if (pm.includes("vnpay")) return "Cổng VNPAY-QR";
    if (pm.includes("momo")) return "Ví điện tử MoMo";
    return order.paymentMethod || "Tiền mặt (COD)";
  })();

  const allPaymentOptions: Array<{
    id: PaymentMethodChoice;
    title: string;
    sub: string;
    badge?: string;
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    activeBorder: string;
    activeBg: string;
  }> = [
    {
      id: "banking",
      title: "Chuyển khoản VietQR (MBBank)",
      sub: "Quét mã QR Napas 247 chuyển tiền từ mọi App ngân hàng di động",
      badge: "Phổ biến nhất",
      icon: QrCode,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
      activeBorder: "border-blue-600 ring-2 ring-blue-500/20",
      activeBg: "bg-blue-50/70",
    },
    {
      id: "vnpay",
      title: "Cổng thanh toán VNPAY-QR",
      sub: "Quét mã VNPAY, Thẻ ATM nội địa hoặc Internet Banking tiện lợi",
      icon: CreditCard,
      iconColor: "text-sky-600",
      iconBg: "bg-sky-50",
      activeBorder: "border-sky-600 ring-2 ring-sky-500/20",
      activeBg: "bg-sky-50/70",
    },
    {
      id: "momo",
      title: "Ví điện tử MoMo",
      sub: "Thanh toán quét mã siêu tốc và an toàn qua ứng dụng MoMo",
      icon: Smartphone,
      iconColor: "text-pink-600",
      iconBg: "bg-pink-50",
      activeBorder: "border-[#a50064] ring-2 ring-pink-500/20",
      activeBg: "bg-pink-50/70",
    },
    {
      id: "cod",
      title: "Thu tiền khi nhận hàng (COD)",
      sub: "Thanh toán bằng tiền mặt trực tiếp cho nhân viên khi nhận sách tận nơi",
      icon: Banknote,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
      activeBorder: "border-amber-600 ring-2 ring-amber-500/20",
      activeBg: "bg-amber-50/70",
    },
  ];

  // Nếu đang ở phương thức nào thì KHÔNG hiển thị phương thức đó, CHỈ hiển thị những phương thức còn lại
  const remainingOptions = allPaymentOptions.filter((opt) => opt.id !== currentMethodId);

  useEffect(() => {
    if (remainingOptions.length > 0) {
      setSelectedMethod(remainingOptions[0].id);
    }
  }, [order?.id, order?.paymentMethod, isOpen]);

  if (!isOpen || !order) return null;

  const handleConfirm = () => {
    onSelectMethod(selectedMethod);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                Đổi phương thức thanh toán
              </h3>
              <p className="text-xs text-slate-500">
                Đơn hàng: <strong className="font-mono text-blue-600 font-bold">#{order.id}</strong> &bull; Tổng tiền:{" "}
                <strong className="text-red-600 font-bold">{formatVND(order.totalAmount)}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung danh sách phương thức */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto custom-scrollbar text-xs">
          {/* Thông báo trạng thái hiện tại */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div className="text-slate-600 text-xs">
              Phương thức hiện tại: <strong className="text-slate-900 font-bold">{currentMethodFormatted}</strong>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
              {order.status}
            </span>
          </div>

          <p className="text-xs text-slate-600 font-medium">
            Chọn phương thức thanh toán mới bạn muốn chuyển đổi sang:
          </p>

          <div className="space-y-2.5">
            {remainingOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedMethod === opt.id;

              return (
                <label
                  key={opt.id}
                  onClick={() => setSelectedMethod(opt.id)}
                  className={`relative border-2 rounded-2xl p-3.5 flex items-start space-x-3.5 cursor-pointer transition-all duration-200 select-none ${
                    isSelected
                      ? opt.activeBorder + " " + opt.activeBg
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${opt.iconBg} ${opt.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {opt.title}
                      </span>
                      {opt.badge && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                          <Sparkles className="w-3 h-3" />
                          <span>{opt.badge}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11.5px] text-slate-500 mt-0.5 leading-relaxed">
                      {opt.sub}
                    </p>
                  </div>

                  <input
                    type="radio"
                    name="paymentMethodChoice"
                    value={opt.id}
                    checked={isSelected}
                    onChange={() => setSelectedMethod(opt.id)}
                    className="absolute right-4 top-4 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              );
            })}
          </div>

          <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center space-x-2 text-[11px] text-blue-800">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Hệ thống mã hóa bảo mật chuẩn Napas & Ngân hàng Nhà nước. Đơn hàng sẽ được tự động đồng bộ tức thì sau khi chuyển đổi.
            </span>
          </div>
        </div>

        {/* Nút hành động ở Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-100 transition-colors text-xs cursor-pointer"
          >
            Giữ nguyên / Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-sm transition-all text-xs cursor-pointer"
          >
            <span>Xác nhận đổi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
