import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Component Bắt lỗi toàn cục (Global Error Boundary)
 * - Ngăn chặn ứng dụng React bị sập hoàn toàn gây ra hiện tượng màn hình trắng (White Screen of Death).
 * - Cung cấp giao diện thông báo lỗi thân thiện kèm nút bấm tải lại trang hoặc quay về trang chủ.
 */
export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Cập nhật state khi có lỗi phát sinh trong component con
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Ghi nhật ký lỗi vào console phục vụ gỡ lỗi kỹ thuật
    console.error("❌ [ErrorBoundary] Phát hiện lỗi giao diện chưa xử lý:", error, errorInfo);
  }

  private handleReload = () => {
    // Tải lại trang cứng từ máy chủ (bỏ qua cache)
    window.location.reload();
  };

  private handleGoHome = () => {
    // Chuyển hướng về trang chủ
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-lg border border-slate-200 p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900">
                Đã xảy ra sự cố khi tải ứng dụng
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hệ thống phát hiện phiên bản mới đã được cập nhật hoặc tài nguyên trình duyệt tạm thời bị gián đoạn. Vui lòng tải lại trang để nạp bản mới nhất.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-50 rounded-xl text-left border border-slate-200 max-h-32 overflow-y-auto">
                <p className="text-xs font-mono text-red-600 break-words">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tải Lại Trang</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>Về Trang Chủ</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
