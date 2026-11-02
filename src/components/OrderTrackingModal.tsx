import React, { useState, useEffect } from "react";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  Phone,
  User,
  X,
  CreditCard,
  AlertCircle
} from "lucide-react";
import { OrderRecord } from "./AdminPanel";

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderRecord[];
  selectedOrder?: OrderRecord | null;
  initialOrderId?: string;
}

export default function OrderTrackingModal({
  isOpen,
  onClose,
  orders,
  selectedOrder,
  initialOrderId
}: OrderTrackingModalProps) {
  const [searchInput, setSearchInput] = useState("");
  const [searchedOrder, setSearchedOrder] = useState<OrderRecord | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Tự động tải lộ trình đơn hàng ngay khi mở modal nếu có selectedOrder hoặc initialOrderId
  useEffect(() => {
    if (isOpen) {
      if (selectedOrder) {
        setSearchInput(selectedOrder.id);
        setSearchedOrder(selectedOrder);
        setHasSearched(true);
      } else if (initialOrderId && initialOrderId.trim()) {
        const q = initialOrderId.trim().toLowerCase();
        setSearchInput(initialOrderId.trim());
        const found = orders.find(
          (o) =>
            o.id.toLowerCase() === q ||
            (o.customerInfo?.phone && o.customerInfo.phone.trim() === q)
        );
        setSearchedOrder(found || null);
        setHasSearched(true);
      } else {
        setSearchInput("");
        setSearchedOrder(null);
        setHasSearched(false);
      }
    }
  }, [isOpen, selectedOrder, initialOrderId, orders]);

  if (!isOpen) return null;

  // Xử lý tìm kiếm đơn hàng theo Mã đơn hoặc Số điện thoại
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    const q = searchInput.trim().toLowerCase();
    const found = orders.find(
      (o) =>
        o.id.toLowerCase() === q ||
        o.id.toLowerCase().includes(q) ||
        (o.customerInfo?.phone && o.customerInfo.phone.trim().includes(q))
    );

    setSearchedOrder(found || null);
    setHasSearched(true);
  };

  // Định dạng hiển thị tiền VNĐ
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);
  };

  // Xác định bước hiện tại trong lộ trình giao hàng (0: Hủy, 1: Xử lý, 2: Giao hàng, 3: Hoàn tất)
  const getTimelineStep = (status: string) => {
    switch (status) {
      case "Đang xử lý":
        return 1;
      case "Đang giao":
        return 2;
      case "Hoàn tất":
        return 3;
      case "Đã hủy":
        return -1;
      default:
        return 1;
    }
  };

  const currentStep = searchedOrder ? getTimelineStep(searchedOrder.status) : 1;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] flex flex-col">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                Tra Cứu Tiến Trình Đơn Hàng
              </h3>
              <p className="text-xs text-slate-400">
                Nhập mã đơn hàng hoặc số điện thoại để kiểm tra lộ trình giao sách
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

        {/* Thanh tìm kiếm mã đơn */}
        <form onSubmit={handleSearch} className="mt-5 flex items-center space-x-2 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Nhập mã đơn (VD: DB-123456) hoặc số điện thoại..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all shrink-0"
          >
            Tra cứu
          </button>
        </form>

        {/* Kết quả tra cứu */}
        <div className="mt-5 overflow-y-auto flex-1 pr-1 space-y-4">
          {!hasSearched ? (
            <div className="space-y-4">
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-100">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">
                  Vui lòng nhập mã đơn hàng của bạn vào ô trên để theo dõi tiến trình
                </p>
              </div>

              {orders && orders.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700">
                    Đơn hàng gần đây của bạn (nhấn để xem lộ trình ngay):
                  </p>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {orders.slice(0, 5).map((ord) => (
                      <button
                        key={ord.id}
                        type="button"
                        onClick={() => {
                          setSearchInput(ord.id);
                          setSearchedOrder(ord);
                          setHasSearched(true);
                        }}
                        className="w-full text-left p-3 rounded-xl border border-slate-200/80 hover:border-blue-500 hover:bg-blue-50/50 transition-all flex items-center justify-between group"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-xs text-slate-800 group-hover:text-blue-600">
                              {ord.id}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                              {ord.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {ord.items?.length || 0} sản phẩm • {ord.date}
                          </p>
                        </div>
                        <span className="font-bold text-xs text-blue-600">
                          {formatVND(ord.totalAmount)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : !searchedOrder ? (
            <div className="p-8 text-center bg-amber-50/70 border border-amber-200 rounded-2xl">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <h4 className="font-bold text-slate-800 text-sm">Không tìm thấy đơn hàng</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Không tìm thấy đơn hàng nào khớp với từ khóa "{searchInput}". Vui lòng kiểm tra lại mã đơn hoặc số điện thoại.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Thông tin đầu đơn hàng */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400">Mã đơn hàng</span>
                  <h4 className="font-mono font-black text-slate-900 text-base">
                    {searchedOrder.id}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ngày đặt: {searchedOrder.date}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400">Tổng thanh toán</span>
                  <h4 className="font-black text-blue-600 text-base">
                    {formatVND(searchedOrder.totalAmount)}
                  </h4>
                  <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block mt-0.5">
                    {searchedOrder.paymentMethod || "COD"}
                  </span>
                </div>
              </div>

              {/* Lộ trình Timeline 4 bước */}
              {currentStep === -1 ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-center text-red-700">
                  <XCircle className="w-8 h-8 mx-auto mb-1 text-red-500" />
                  <h5 className="font-bold text-sm">Đơn hàng này đã bị hủy</h5>
                  <p className="text-xs mt-0.5 text-red-500">
                    Nếu có thắc mắc, vui lòng liên hệ hotline hỗ trợ khách hàng của BookStore.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                  <h5 className="font-bold text-slate-800 text-xs mb-4">
                    Tiến độ vận chuyển đơn hàng:
                  </h5>

                  <div className="relative flex justify-between items-center px-4">
                    {/* Đường nối thanh tiến độ */}
                    <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-1 bg-slate-100 -z-0">
                      <div
                        className="bg-blue-600 h-full transition-all duration-500"
                        style={{
                          width:
                            currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%"
                        }}
                      />
                    </div>

                    {/* Bước 1: Tiếp nhận */}
                    <div className="flex flex-col items-center z-10">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                          currentStep >= 1
                            ? "bg-blue-600 text-white"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 mt-1.5">
                        Đã đặt hàng
                      </span>
                    </div>

                    {/* Bước 2: Đang giao */}
                    <div className="flex flex-col items-center z-10">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                          currentStep >= 2
                            ? "bg-blue-600 text-white"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        <Truck className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 mt-1.5">
                        Đang giao hàng
                      </span>
                    </div>

                    {/* Bước 3: Hoàn tất */}
                    <div className="flex flex-col items-center z-10">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                          currentStep >= 3
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 mt-1.5">
                        Giao thành công
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Thông tin người nhận */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                <div className="flex items-center space-x-2 text-slate-700">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Người nhận: <strong>{searchedOrder.customerInfo?.fullName}</strong>
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Số điện thoại: {searchedOrder.customerInfo?.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Địa chỉ: {searchedOrder.customerInfo?.address}</span>
                </div>
              </div>

              {/* Danh sách sách trong đơn */}
              <div className="space-y-2">
                <h5 className="font-bold text-slate-800 text-xs">Các cuốn sách trong đơn:</h5>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(searchedOrder.items || []).map((it, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2.5">
                        {it.product.imageUrl && (
                          <img
                            src={it.product.imageUrl}
                            alt={it.product.name}
                            className="w-8 h-11 object-cover rounded-md"
                          />
                        )}
                        <div>
                          <p className="font-bold text-slate-800 line-clamp-1">
                            {it.product.name}
                          </p>
                          <span className="text-[11px] text-slate-400">
                            Số lượng: x{it.quantity}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-slate-700">
                        {formatVND(it.product.price * it.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 mt-4 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
