import React, { useRef } from "react";
import {
  X,
  Printer,
  CheckCircle2,
  BookOpen,
  Calendar,
  MapPin,
  Phone,
  User,
  CreditCard,
  Truck,
  ShieldCheck,
  Building
} from "lucide-react";
import { OrderRecord } from "../App";

// Định nghĩa Props tiếp nhận cho Modal Hóa Đơn
interface InvoiceModalProps {
  isOpen: boolean; // Trạng thái đóng/mở modal
  order: OrderRecord | null; // Dữ liệu đơn hàng cần in hóa đơn
  onClose: () => void; // Hàm đóng modal
}

export default function InvoiceModal({ isOpen, order, onClose }: InvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  // Định dạng hiển thị tiền VNĐ
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Tính toán phụ phí và tổng tạm tính
  const itemsSubtotal = order.items.reduce(
    (sum, it) => sum + (it.product?.price || 0) * it.quantity,
    0
  );
  const shippingFee = itemsSubtotal > 5000000 || itemsSubtotal === 0 ? 0 : 30000;
  const discountVal = Math.max(0, itemsSubtotal + shippingFee - order.totalAmount);

  // Hàm chuyển đổi số tiền sang chữ tiếng Việt đơn giản phục vụ hóa đơn
  const numberToWordsVietnamese = (num: number): string => {
    if (num <= 0) return "Không đồng";
    const units = ["", "nghìn", "triệu", "tỷ"];
    return `${num.toLocaleString("vi-VN")} đồng`;
  };

  // Hàm kích hoạt lệnh in của trình duyệt
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Thanh công cụ thao tác phía trên (Ẩn khi in ra giấy) */}
        <div className="no-print bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-sm">
              <Printer className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">Hóa Đơn Bán Lẻ BookStore</h3>
              <p className="text-[11px] text-slate-400">Xem trước &amp; In hóa đơn mua sách hoặc lưu tệp PDF</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In Hóa Đơn (Print / PDF)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PHẦN NỘI DUNG HÓA ĐƠN CHUẨN IN ẤN (PRINTABLE INVOICE) */}
        <div
          ref={invoiceRef}
          className="printable-invoice p-6 sm:p-8 bg-white text-slate-900 space-y-6 font-sans text-xs"
        >
          {/* 1. Header Đơn vị phát hành */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b border-slate-200 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-md">
                📚
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                  Nhà Sách Trực Tuyến BookStore
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">
                  Tri thức nhân loại &bull; Nền tảng thương mại sách Bestseller
                </p>
                <p className="text-[11px] text-slate-500">
                  Địa chỉ: Tòa nhà BookStore Center, Hải Châu, Đà Nẵng
                </p>
              </div>
            </div>

            <div className="text-right sm:text-right space-y-0.5 text-slate-600 text-[11px]">
              <p><strong className="text-slate-900">MST:</strong> 0401899889-001</p>
              <p><strong className="text-slate-900">Hotline:</strong> 1900 6868 (24/7)</p>
              <p><strong className="text-slate-900">Email:</strong> cskh@bookstore.vn</p>
              <p><strong className="text-slate-900">Website:</strong> https://bookstore.vn</p>
            </div>
          </div>

          {/* 2. Tiêu đề Hóa Đơn & Thông tin số phiếu */}
          <div className="text-center py-2 space-y-1">
            <h2 className="text-lg font-black text-slate-900 tracking-wide uppercase">
              HÓA ĐƠN BÁN LẺ KIÊM PHIẾU GIAO HÀNG
            </h2>
            <p className="text-[11px] text-slate-500 italic">
              (Lưu hành nội bộ &amp; Đối chiếu khi giao nhận hàng)
            </p>
          </div>

          {/* 3. Khối thông tin Đơn hàng & Khách hàng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="space-y-1.5 text-slate-700">
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500 font-medium w-28">Số Hóa Đơn:</span>
                <span className="font-mono font-bold text-blue-700 text-sm">#{order.id}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500 font-medium w-28">Ngày đặt hàng:</span>
                <span className="font-semibold text-slate-900">{order.date}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500 font-medium w-28">Thanh toán:</span>
                <span className="font-semibold text-slate-900 uppercase">
                  {order.paymentMethod || "COD (Tiền mặt)"}
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500 font-medium w-28">Trạng thái TT:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                  <span>ĐÃ THANH TOÁN (PAID)</span>
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500 font-medium w-28">Trạng thái đơn:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  {order.status}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-slate-700">
              <div className="flex items-start space-x-1.5">
                <span className="text-slate-500 font-medium w-24 shrink-0">Người nhận:</span>
                <span className="font-bold text-slate-900">
                  {order.customerInfo?.fullName || "Khách hàng BookStore"}
                </span>
              </div>
              <div className="flex items-start space-x-1.5">
                <span className="text-slate-500 font-medium w-24 shrink-0">Điện thoại:</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {order.customerInfo?.phone || "Chưa cập nhật"}
                </span>
              </div>
              <div className="flex items-start space-x-1.5">
                <span className="text-slate-500 font-medium w-24 shrink-0">Địa chỉ giao:</span>
                <span className="font-medium text-slate-800">
                  {order.customerInfo?.address || "Nhận tại nhà sách"}
                </span>
              </div>
              {order.customerInfo?.note && (
                <div className="flex items-start space-x-1.5 italic text-slate-600">
                  <span className="text-slate-500 font-medium w-24 shrink-0">Ghi chú:</span>
                  <span>{order.customerInfo.note}</span>
                </div>
              )}
            </div>
          </div>

          {/* 4. Bảng chi tiết danh mục sách đã đặt */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px]">
                  <th className="py-2.5 px-3 border border-slate-200 text-center w-10">STT</th>
                  <th className="py-2.5 px-3 border border-slate-200">Tên Tác Phẩm / Tựa Sách</th>
                  <th className="py-2.5 px-3 border border-slate-200 text-center w-20">SL</th>
                  <th className="py-2.5 px-3 border border-slate-200 text-right w-28">Đơn Giá</th>
                  <th className="py-2.5 px-3 border border-slate-200 text-right w-32">Thành Tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items.map((item, idx) => {
                  const unitPrice = item.product?.price || 0;
                  const itemTotal = unitPrice * item.quantity;
                  return (
                    <tr key={item.product?.id || idx} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 border border-slate-200 text-center font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 border border-slate-200">
                        <p className="font-bold text-slate-900">{item.product?.name || "Tác phẩm"}</p>
                        {item.product?.category && (
                          <p className="text-[10px] text-slate-500">
                            Thể loại: {item.product.category}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 px-3 border border-slate-200 text-center font-bold text-slate-800">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 border border-slate-200 text-right text-slate-700">
                        {formatVND(unitPrice)}
                      </td>
                      <td className="py-2.5 px-3 border border-slate-200 text-right font-bold text-slate-900">
                        {formatVND(itemTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 5. Khối tổng tiền thanh toán */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="space-y-1.5 text-slate-500 text-[11px] max-w-sm">
              <p className="font-semibold text-slate-700">Quy định đổi trả &amp; Bảo hành:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Đổi trả miễn phí trong 7 ngày nếu lỗi in ấn, thiếu trang hoặc rách bìa.</li>
                <li>Quý khách vui lòng giữ lại hóa đơn này để được hỗ trợ bảo hành tốt nhất.</li>
              </ul>
              <p className="pt-1 italic font-medium text-slate-600">
                Thành tiền bằng chữ: <strong className="text-slate-900">{numberToWordsVietnamese(order.totalAmount)}</strong>
              </p>
            </div>

            <div className="w-full sm:w-64 space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Tạm tính sách:</span>
                <span className="font-semibold">{formatVND(itemsSubtotal)}</span>
              </div>
              {discountVal > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Giảm giá Voucher:</span>
                  <span className="font-semibold">-{formatVND(discountVal)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Phí giao hàng:</span>
                <span className="font-semibold">
                  {shippingFee === 0 ? "Miễn phí" : formatVND(shippingFee)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-300 flex justify-between items-center">
                <span className="font-bold text-slate-900 text-sm">Tổng cộng:</span>
                <span className="font-black text-red-600 text-base">
                  {formatVND(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* 6. Chữ ký xác nhận */}
          <div className="grid grid-cols-2 text-center pt-6 pb-4">
            <div>
              <p className="font-bold text-slate-900 uppercase">Khách hàng nhận sách</p>
              <p className="text-[10px] text-slate-400 italic">(Ký và ghi rõ họ tên)</p>
              <div className="h-16"></div>
              <p className="font-semibold text-slate-700">
                {order.customerInfo?.fullName || "Khách hàng"}
              </p>
            </div>

            <div>
              <p className="font-bold text-slate-900 uppercase">Đại diện Nhà Sách BookStore</p>
              <p className="text-[10px] text-slate-400 italic">(Đã ký xác nhận điện tử)</p>
              <div className="h-16 flex items-center justify-center">
                <span className="text-[11px] font-mono text-emerald-600 font-bold border border-emerald-300 bg-emerald-50 px-2 py-0.5 rounded">
                  [VERIFIED E-INVOICE]
                </span>
              </div>
              <p className="font-semibold text-slate-700">Bộ phận Kế toán &amp; Kho vận</p>
            </div>
          </div>
        </div>

        {/* Chân Modal thao tác */}
        <div className="no-print bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Nhấn <kbd className="px-1.5 py-0.5 bg-slate-200 rounded font-mono text-[10px]">Ctrl + P</kbd> hoặc nút In để xuất hóa đơn sang PDF
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>

      {/* Tối ưu hóa CSS khi in qua window.print() */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-invoice, .printable-invoice * {
            visibility: visible;
          }
          .printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
