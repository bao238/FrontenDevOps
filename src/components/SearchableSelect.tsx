import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, Check, X, Plus } from "lucide-react";

export interface SearchableOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[] | SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  allLabel?: string;
  className?: string;
  triggerClassName?: string;
  hideAllOption?: boolean;
  allowCustom?: boolean;
}

/**
 * Component SearchableSelect - Dropdown thanh xổ xuống danh sách có ô tìm kiếm theo tên thời gian thực
 * Hỗ trợ chọn nhanh từ danh sách có sẵn, tìm kiếm thời gian thực theo tên NXB/Tác giả,
 * và cho phép nhập giá trị tùy chỉnh nếu cần.
 */
export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Chọn mục...",
  searchPlaceholder = "Tìm kiếm theo tên...",
  allLabel = "Tất cả",
  className = "",
  triggerClassName = "",
  hideAllOption = false,
  allowCustom = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Chuẩn hóa danh sách options thành dạng mảng đối tượng { value, label }
  const normalizedOptions = useMemo<SearchableOption[]>(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Lọc danh sách theo từ khóa tìm kiếm người dùng gõ
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.trim().toLowerCase();
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(q)
    );
  }, [normalizedOptions, searchQuery]);

  // Tìm nhãn hiển thị của giá trị hiện tại
  const currentLabel = useMemo(() => {
    if (value === "all") {
      return hideAllOption ? placeholder : `${allLabel} (${normalizedOptions.length})`;
    }
    const found = normalizedOptions.find((opt) => opt.value === value);
    return found ? found.label : (value || placeholder);
  }, [value, allLabel, normalizedOptions, hideAllOption, placeholder]);

  // Tự động focus vào ô tìm kiếm khi mở dropdown menu
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Xử lý đóng dropdown khi người dùng click ra ngoài hoặc bấm Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (selectedVal: string) => {
    onChange(selectedVal);
    setIsOpen(false);
  };

  // Xác định xem giá trị tìm kiếm có phải giá trị mới chưa có trong danh sách hay không
  const isCustomNewValue =
    allowCustom &&
    searchQuery.trim() !== "" &&
    !normalizedOptions.some(
      (opt) => opt.value.toLowerCase() === searchQuery.trim().toLowerCase()
    );

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      {/* Nút bấm hiển thị Thanh Xổ Xuống Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={
          triggerClassName
            ? `w-full flex items-center justify-between text-left focus:outline-none focus:ring-1.5 focus:ring-blue-500 transition-all cursor-pointer ${triggerClassName}`
            : "w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer shadow-2xs"
        }
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate pr-2 text-slate-800">
          {currentLabel || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-blue-600" : ""
          }`}
        />
      </button>

      {/* Menu xổ xuống chứa ô tìm kiếm và danh sách lựa chọn */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-150 min-w-[220px]">
          {/* Ô nhập tìm kiếm theo tên NXB/Tác giả */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (isCustomNewValue) {
                    handleSelect(searchQuery.trim());
                  } else if (filteredOptions.length > 0) {
                    handleSelect(filteredOptions[0].value);
                  }
                }
              }}
              placeholder={searchPlaceholder}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-7 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Danh sách các lựa chọn có thanh cuộn mượt mà */}
          <div
            className="max-h-52 overflow-y-auto space-y-0.5 custom-scrollbar pr-0.5"
            role="listbox"
          >
            {/* Lựa chọn 'Tất cả' ở đầu danh sách nếu không bị ẩn và không đang gõ tìm kiếm */}
            {!hideAllOption && !searchQuery && (
              <button
                type="button"
                onClick={() => handleSelect("all")}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                  value === "all"
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
                role="option"
                aria-selected={value === "all"}
              >
                <span className="truncate">{allLabel} ({normalizedOptions.length})</span>
                {value === "all" && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
              </button>
            )}

            {/* Tùy chọn sử dụng giá trị tùy chỉnh nếu bật allowCustom và từ khóa chưa có trong danh sách */}
            {isCustomNewValue && (
              <button
                type="button"
                onClick={() => handleSelect(searchQuery.trim())}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 flex items-center space-x-1.5 border border-dashed border-blue-200 transition-colors mb-1"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Sử dụng: "{searchQuery.trim()}"</span>
              </button>
            )}

            {/* Danh sách các NXB / Tác giả đã lọc */}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="truncate pr-2">{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </button>
                );
              })
            ) : (
              !isCustomNewValue && (
                <div className="py-4 px-2 text-center text-xs text-slate-400 font-medium">
                  Không tìm thấy kết quả phù hợp
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};
