import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TechStore - Cửa hàng Công nghệ Trực tuyến | DevOps CI/CD Demo",
  description: "Dự án Shop bán hàng online Next.js 14 tích hợp Docker, GitHub Actions và triển khai trên Render",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen flex flex-col selection:bg-blue-600 selection:text-white">

        {/* Main Application Container */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        {/* E-Commerce Footer */}
        <footer className="bg-white border-t border-slate-200 mt-16 text-slate-600 text-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    T
                  </div>
                  <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                    TechStore
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Cửa hàng thiết bị công nghệ chính hãng. Dự án thực hành triển khai tự động CI/CD với Docker, GitHub Actions và Render Web Service.
                </p>
                <div className="text-xs text-slate-400">
                  Khoa CNTT - Đại học Đông Á
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 text-sm mb-3">Chính sách mua hàng</h4>
                <ul className="space-y-2 text-xs text-slate-500">
                  <li><a href="#" className="hover:text-blue-600">Giao hàng toàn quốc (Freeship từ 500k)</a></li>
                  <li><a href="#" className="hover:text-blue-600">Bảo hành chính hãng 12-24 tháng</a></li>
                  <li><a href="#" className="hover:text-blue-600">Đổi trả miễn phí 30 ngày</a></li>
                  <li><a href="#" className="hover:text-blue-600">Chính sách bảo mật thông tin</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 text-sm mb-3">Hỗ trợ khách hàng</h4>
                <ul className="space-y-2 text-xs text-slate-500">
                  <li>Hotline: <strong className="text-slate-700">1900 8888</strong> (8:00 - 21:00)</li>
                  <li>Email: support@techstore-devops.vn</li>
                  <li>Địa chỉ: 33 Xô Viết Nghệ Tĩnh, Đà Nẵng</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 text-sm mb-3">Hạ tầng & Triển khai</h4>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-1 bg-slate-100 rounded text-[11px] font-mono text-slate-700 border">Next.js 14</span>
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[11px] font-mono border border-blue-200">Docker</span>
                  <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-[11px] font-mono border border-purple-200">GitHub Actions</span>
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-[11px] font-mono border border-emerald-200">Render Cloud</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Containerized via multi-stage Docker build.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
              <p>&copy; {new Date().getFullYear()} TechStore. Dự án mẫu thực hành môn học DevOps.</p>
              <p className="font-medium text-slate-500">
                Designed with Next.js 14 & Tailwind CSS
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
