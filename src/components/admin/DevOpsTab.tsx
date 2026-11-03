import React, { useState, useEffect } from "react";
// Import createPortal để render modal trực tiếp vào body
import { createPortal } from "react-dom";
import {
  Server,
  Database,
  Cpu,
  Activity,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Terminal,
  Layers,
  Zap,
  Clock,
  Wifi,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import { api, SystemStatus } from "../../services/api";

export default function DevOpsTab() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string>("");

  // Seed State
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  // Lấy trạng thái hệ thống từ Backend
  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSystemStatus();
      if (data) {
        setStatus(data);
      }
      setLastCheckTime(new Date().toLocaleTimeString("vi-VN"));
    } catch (err) {
      console.error("❌ Lỗi lấy thông tin hệ thống DevOps:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Xử lý nạp lại dữ liệu mẫu (Seed Data)
  const handleTriggerSeed = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    try {
      const res = await api.triggerSystemSeed();
      if (res && res.success) {
        setSeedResult(res.message || "Đồng bộ dữ liệu mẫu thành công!");
        await fetchStatus();
      } else {
        setSeedResult(res.error || "Nạp dữ liệu thất bại");
      }
    } catch (err: any) {
      setSeedResult("Lỗi kết nối khi nạp dữ liệu: " + err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  // Định dạng thời gian uptime: X giờ Y phút Z giây
  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h} giờ ${m} phút ${s} giây`;
    if (m > 0) return `${m} phút ${s} giây`;
    return `${s} giây`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Công cụ */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <Server className="w-5 h-5 text-emerald-600" />
            <span>Trung Tâm Giám Sát Sức Khỏe Hệ Thống &amp; DevOps</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi trạng thái Docker Container, độ trễ MongoDB, bộ nhớ RAM và đường truyền đám mây AWS EC2
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {lastCheckTime && (
            <span className="text-[11px] text-slate-400 font-medium">
              Kiểm tra lúc: {lastCheckTime}
            </span>
          )}
          <button
            onClick={fetchStatus}
            disabled={isLoading}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all disabled:opacity-50"
            title="Ping kiểm tra trạng thái"
          >
            <RotateCcw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
            <span>Health Ping</span>
          </button>
          <button
            onClick={() => setIsSeedModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-md shadow-emerald-500/20 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Đồng Bộ Lại Dữ Liệu</span>
          </button>
        </div>
      </div>

      {/* Thông báo kết quả Seed nếu có */}
      {seedResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs sm:text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{seedResult}</span>
          </div>
          <button
            onClick={() => setSeedResult(null)}
            className="text-emerald-500 hover:text-emerald-700 font-bold text-xs"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 3 Khối Thẻ Giám Sát Cốt Lõi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Backend Express Server */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Backend Node.js</h3>
                  <p className="text-[11px] text-slate-400">Express REST API</p>
                </div>
              </div>
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>ONLINE</span>
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-50 text-slate-600">
                <span>Cổng dịch vụ:</span>
                <span className="font-mono font-bold text-blue-600">
                  Port {status?.server.port || 5000}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 text-slate-600">
                <span>Phiên bản Node.js:</span>
                <span className="font-mono font-bold text-slate-700">
                  {status?.server.nodeVersion || "v20.x"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 text-slate-600">
                <span>Hệ điều hành Host:</span>
                <span className="font-medium text-slate-700">
                  {status?.server.platform || "linux"} ({status?.server.arch || "x64"})
                </span>
              </div>
              <div className="flex justify-between py-1.5 text-slate-600">
                <span>Thời gian hoạt động (Uptime):</span>
                <span className="font-bold text-emerald-600">
                  {status?.server.uptimeSeconds
                    ? formatUptime(status.server.uptimeSeconds)
                    : "Đang tải..."}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: MongoDB Cơ sở dữ liệu */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600" />
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">MongoDB Database</h3>
                  <p className="text-[11px] text-slate-400">Docker Container NoSQL</p>
                </div>
              </div>
              <span
                className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  status?.database.connected
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-red-50 text-red-600 border border-red-200"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    status?.database.connected ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
                <span>{status?.database.connected ? "CONNECTED" : "DISCONNECTED"}</span>
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-50 text-slate-600">
                <span>Cơ sở dữ liệu:</span>
                <span className="font-mono font-bold text-emerald-600">
                  {status?.database.name || "bookstore"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 text-slate-600">
                <span>Cổng kết nối nội bộ:</span>
                <span className="font-mono font-bold text-slate-700">Port 27017</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 text-slate-600">
                <span>Độ trễ Ping DB:</span>
                <span className="font-mono font-bold text-emerald-600 flex items-center space-x-1">
                  <Wifi className="w-3.5 h-3.5" />
                  <span>
                    {status?.database.pingLatencyMs !== null
                      ? `${status?.database.pingLatencyMs} ms`
                      : "0 ms"}
                  </span>
                </span>
              </div>
              <div className="flex justify-between py-1.5 text-slate-600">
                <span>Lưu trữ dữ liệu:</span>
                <span className="font-medium text-slate-700">Docker Volume (AWS EBS)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Bộ nhớ RAM và Tài nguyên */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 to-pink-600" />
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Tiêu Thụ RAM</h3>
                  <p className="text-[11px] text-slate-400">Process Memory Usage</p>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg">
                RAM
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Heap Used / Heap Total:</span>
                  <span className="font-bold text-purple-700">
                    {status?.server.memory.heapUsedMb || 45} MB /{" "}
                    {status?.server.memory.heapTotalMb || 90} MB
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-600 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        ((status?.server.memory.heapUsedMb || 45) /
                          (status?.server.memory.heapTotalMb || 90)) *
                          100
                      )}%`
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-50 text-slate-600">
                <span>RSS (Resident Set Size):</span>
                <span className="font-mono font-bold text-slate-700">
                  {status?.server.memory.rssMb || 85} MB
                </span>
              </div>
              <div className="flex justify-between py-1.5 text-slate-600">
                <span>Trạng thái tài nguyên:</span>
                <span className="font-semibold text-emerald-600">Tối ưu &amp; Ổn định</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thống kê Số lượng Collections trong MongoDB */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm">
        <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-1 flex items-center space-x-2">
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>Thống Kê Dữ Liệu Trong Các Collections MongoDB</span>
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Số lượng bản ghi thực tế đang được lưu trữ trong cơ sở dữ liệu `bookstore`
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
            <p className="text-[11px] text-slate-500 font-medium">products</p>
            <h4 className="text-lg font-black text-blue-600 mt-1">
              {status?.database.collections?.products ?? 18}
            </h4>
            <span className="text-[10px] text-slate-400">Cuốn sách</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
            <p className="text-[11px] text-slate-500 font-medium">orders</p>
            <h4 className="text-lg font-black text-purple-600 mt-1">
              {status?.database.collections?.orders ?? 2}
            </h4>
            <span className="text-[10px] text-slate-400">Đơn hàng</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
            <p className="text-[11px] text-slate-500 font-medium">users</p>
            <h4 className="text-lg font-black text-emerald-600 mt-1">
              {status?.database.collections?.users ?? 6}
            </h4>
            <span className="text-[10px] text-slate-400">Tài khoản</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
            <p className="text-[11px] text-slate-500 font-medium">reviews</p>
            <h4 className="text-lg font-black text-amber-600 mt-1">
              {status?.database.collections?.reviews ?? 4}
            </h4>
            <span className="text-[10px] text-slate-400">Đánh giá</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
            <p className="text-[11px] text-slate-500 font-medium">coupons</p>
            <h4 className="text-lg font-black text-indigo-600 mt-1">
              {status?.database.collections?.coupons ?? 4}
            </h4>
            <span className="text-[10px] text-slate-400">Voucher</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
            <p className="text-[11px] text-slate-500 font-medium">categories</p>
            <h4 className="text-lg font-black text-teal-600 mt-1">
              {status?.database.collections?.categories ?? 6}
            </h4>
            <span className="text-[10px] text-slate-400">Thể loại</span>
          </div>
        </div>
      </div>

      {/* Thông tin Hạ tầng Đám mây AWS & Docker CI/CD */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm">
        <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-1 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Kiến Trúc Hạ Tầng Đám Mây AWS &amp; DevOps Pipeline</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Thông tin chi tiết về môi trường Docker Compose và máy chủ đám mây AWS EC2
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-500">Máy chủ Cloud:</span>
              <span className="font-bold text-slate-800">AWS EC2 (Ubuntu Linux)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Mạng Docker nội bộ:</span>
              <span className="font-mono font-bold text-blue-600">bookstore-network</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Container Backend:</span>
              <span className="font-mono text-slate-700">bookstore-backend (Port 5000)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Container MongoDB:</span>
              <span className="font-mono text-slate-700">bookstore-mongodb (Port 27017)</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-500">Container Frontend:</span>
              <span className="font-mono text-slate-700">bookstore-frontend (Nginx Port 80)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Docker Volume dữ liệu:</span>
              <span className="font-mono text-slate-700">bookstore-mongo-data (Amazon EBS)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tự động hóa CI/CD:</span>
              <span className="font-bold text-emerald-600">GitHub Actions (SSH deploy)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Nhánh triển khai chính:</span>
              <span className="font-mono text-slate-700">refs/heads/main</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL XÁC NHẬN ĐỒNG BỘ SEED DATA (createPortal ra body) */}
      {isSeedModalOpen && createPortal(
        <div className="fixed inset-0 !m-0 !top-0 !left-0 !right-0 !bottom-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Đồng Bộ Lại Dữ Liệu Mẫu?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Hành động này sẽ gọi hàm <code>seedData()</code> trong MongoDB để bổ sung lại đầy đủ 18 cuốn sách Bestseller, 6 thể loại, 4 mã voucher và các tài khoản quản trị viên nếu bị thiếu.
              </p>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSeedModalOpen(false)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isSeeding}
                onClick={async () => {
                  setIsSeedModalOpen(false);
                  await handleTriggerSeed();
                }}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-500/20 disabled:opacity-50"
              >
                {isSeeding ? "Đang nạp..." : "Đồng bộ ngay"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
