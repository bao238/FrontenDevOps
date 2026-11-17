import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  Truck,
  CheckCircle2,
  AlertCircle,
  MapPin,
  User,
  Phone,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { OrderRecord } from "./AdminPanel";

interface OrderScheduleModalProps {
  isOpen: boolean;
  order: OrderRecord | null;
  onClose: () => void;
  onConfirmSchedule: (
    orderId: string,
    scheduleData: {
      pickupTime: string;
      deliveryTime: string;
      shippingCarrier: string;
    }
  ) => void;
}

export default function OrderScheduleModal({
  isOpen,
  order,
  onClose,
  onConfirmSchedule,
}: OrderScheduleModalProps) {
  const [pickupTime, setPickupTime] = useState<string>("");
  const [deliveryTime, setDeliveryTime] = useState<string>("");
  const [shippingCarrier, setShippingCarrier] = useState<string>("Giao Hàng Nhanh (GHN)");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper chuyển đổi Date sang chuỗi format input datetime-local (YYYY-MM-DDTHH:mm)
  const toDatetimeLocal = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${y}-${m}-${d}T${h}:${min}`;
  };

  useEffect(() => {
    if (order && isOpen) {
      setErrorMsg(null);
      // Mặc định thời gian lấy hàng là 2 tiếng sau
      if (order.pickupTime) {
        setPickupTime(toDatetimeLocal(new Date(order.pickupTime)));
      } else {
        const defaultPickup = new Date(Date.now() + 2 * 3600 * 1000);
        setPickupTime(toDatetimeLocal(defaultPickup));
      }

      // Mặc định thời gian giao hàng là 24 tiếng sau
      if (order.deliveryTime) {
        setDeliveryTime(toDatetimeLocal(new Date(order.deliveryTime)));
      } else {
        const defaultDelivery = new Date(Date.now() + 24 * 3600 * 1000);
        setDeliveryTime(toDatetimeLocal(defaultDelivery));
      }

      setShippingCarrier(order.shippingCarrier || "Giao Hàng Nhanh (GHN)");
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Quick preset shortcuts
  const handleSetPickupPreset = (hoursFromNow: number) => {
    const d = new Date(Date.now() + hoursFromNow * 3600 * 1000);
    setPickupTime(toDatetimeLocal(d));
    setErrorMsg(null);
  };

  const handleSetPickupTomorrow = (hour: number, minute: number) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hour, minute, 0, 0);
    setPickupTime(toDatetimeLocal(d));
    setErrorMsg(null);
  };

  const handleSetDeliveryPreset = (daysFromNow: number) => {
    const d = new Date(Date.now() + daysFromNow * 24 * 3600 * 1000);
    setDeliveryTime(toDatetimeLocal(d));
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!pickupTime) {
      setErrorMsg("Vui lòng chọn thời gian shipper lấy hàng.");
      return;
    }
    if (!deliveryTime) {
      setErrorMsg("Vui lòng chọn thời gian giao hàng dự kiến.");
      return;
    }

    const pDate = new Date(pickupTime);
    const dDate = new Date(deliveryTime);

    if (isNaN(pDate.getTime())) {
      setErrorMsg("Thời gian lấy hàng không hợp lệ.");
      return;
    }
    if (isNaN(dDate.getTime())) {
      setErrorMsg("Thời gian giao hàng không hợp lệ.");
      return;
    }
    if (dDate <= pDate) {
      setErrorMsg("Thời gian giao hàng phải diễn ra sau thời gian shipper lấy hàng.");
      return;
    }

    setErrorMsg(null);
    onConfirmSchedule(order.id, {
      pickupTime: pDate.toISOString(),
      deliveryTime: dDate.toISOString(),
      shippingCarrier,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[94vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center space-x-2">
                <span>Hẹn Lịch Vận Chuyển & Xác Nhận Đơn</span>
              </h3>
              <p className="text-xs text-slate-500">
                Mã đơn: <strong className="font-mono text-blue-600 font-bold">#{order.id}</strong> &bull; Tổng tiền:{" "}
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

        {/* Nội dung form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 text-xs">
          {/* Thông tin người nhận vắn tắt */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-slate-700">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900">
              <span className="flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>{order.customerInfo?.fullName || "Khách hàng"}</span>
              </span>
              <span className="flex items-center space-x-1.5 text-slate-600 font-mono font-medium">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>{order.customerInfo?.phone || "Chưa có SĐT"}</span>
              </span>
            </div>
            <div className="flex items-start space-x-1.5 text-slate-500 text-[11.5px]">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
              <span>{order.customerInfo?.address || "Giao tại địa chỉ mặc định"}</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Chọn thời gian shipper lấy hàng */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800 text-xs flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>1. Thời gian shipper lấy hàng tại kho:</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={pickupTime}
              onChange={(e) => {
                setPickupTime(e.target.value);
                setErrorMsg(null);
              }}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
            {/* Phím tắt chọn nhanh thời gian lấy */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-slate-400">Chọn nhanh:</span>
              <button
                type="button"
                onClick={() => handleSetPickupPreset(2)}
                className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition-colors cursor-pointer"
              >
                +2 Giờ nữa
              </button>
              <button
                type="button"
                onClick={() => handleSetPickupPreset(4)}
                className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition-colors cursor-pointer"
              >
                +4 Giờ nữa
              </button>
              <button
                type="button"
                onClick={() => handleSetPickupTomorrow(8, 30)}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Sáng mai (08:30)
              </button>
              <button
                type="button"
                onClick={() => handleSetPickupTomorrow(14, 0)}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Chiều mai (14:00)
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              ⚡ Hệ thống sẽ <strong>tự động chuyển sang &quot;Chờ giao hàng&quot;</strong> khi đến mốc thời gian lấy hàng này.
            </p>
          </div>

          {/* 2. Chọn thời gian giao hàng dự kiến */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <label className="block font-bold text-slate-800 text-xs flex items-center space-x-1.5">
              <Truck className="w-3.5 h-3.5 text-blue-600" />
              <span>2. Thời gian giao hàng dự kiến tới khách:</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={deliveryTime}
              onChange={(e) => {
                setDeliveryTime(e.target.value);
                setErrorMsg(null);
              }}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
            {/* Phím tắt chọn nhanh thời gian giao */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-slate-400">Chọn nhanh:</span>
              <button
                type="button"
                onClick={() => handleSetDeliveryPreset(1)}
                className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition-colors cursor-pointer"
              >
                +1 Ngày (24h)
              </button>
              <button
                type="button"
                onClick={() => handleSetDeliveryPreset(2)}
                className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition-colors cursor-pointer"
              >
                +2 Ngày (48h)
              </button>
              <button
                type="button"
                onClick={() => handleSetDeliveryPreset(3)}
                className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition-colors cursor-pointer"
              >
                +3 Ngày (72h)
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              🔔 Khi đến thời gian giao hàng này, ứng dụng phía khách hàng sẽ <strong>tự động mở nút &quot;Đã Nhận Được Hàng&quot;</strong>.
            </p>
          </div>

          {/* 3. Đơn vị vận chuyển */}
          <div className="space-y-1.5 pt-1 border-t border-slate-100">
            <label className="block font-bold text-slate-800 text-xs">
              3. Đơn vị vận chuyển tiếp nhận:
            </label>
            <select
              value={shippingCarrier}
              onChange={(e) => setShippingCarrier(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
            >
              <option value="Giao Hàng Nhanh (GHN)">Giao Hàng Nhanh (GHN)</option>
              <option value="Giao Hàng Tiết Kiệm (GHTK)">Giao Hàng Tiết Kiệm (GHTK)</option>
              <option value="Viettel Post">Viettel Post</option>
              <option value="Shopee Express (SPX)">Shopee Express (SPX)</option>
              <option value="J&T Express">J&T Express</option>
              <option value="Hỏa tốc 2H (Ahamove / Grab)">Hỏa tốc 2H (Ahamove / Grab)</option>
            </select>
          </div>

          {/* Hộp tóm tắt cơ chế tự động hóa */}
          <div className="p-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/80 rounded-xl text-blue-950 space-y-1 text-[11.5px]">
            <div className="flex items-center space-x-1.5 font-bold text-blue-900">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Cơ chế tự động hóa thời gian thực:</span>
            </div>
            <p className="leading-relaxed text-slate-600">
              Người mua sẽ luôn nhìn thấy thời gian dự kiến cụ thể trên đơn hàng của họ. Hệ thống sẽ tự động đổi trạng thái theo tiến trình thời gian thực mà bạn không phải trực canh chỉnh tay từng bước.
            </p>
          </div>

          {/* Nút hành động */}
          <div className="pt-2 flex items-center justify-end space-x-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-100 transition-colors text-xs cursor-pointer"
            >
              Hủy / Để sau
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-sm transition-all text-xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Xác Nhận & Lên Lịch Vận Chuyển</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
