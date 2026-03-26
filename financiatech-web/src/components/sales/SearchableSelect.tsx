"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search01Icon, Add01Icon } from "hugeicons-react";

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; label: string; sublabel?: string }>;
  placeholder: string;
  onCreateNew: () => void;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  onCreateNew,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 px-3 py-2 rounded-md border border-carbon_black-600 bg-carbon_black text-white text-sm text-left hover:border-mahogany_red/50 transition-colors"
        >
          {selectedOption ? selectedOption.label : placeholder}
        </button>
        <Button
          type="button"
          onClick={onCreateNew}
          className="bg-mahogany_red hover:bg-mahogany_red-600 text-white px-3"
        >
          <Add01Icon size={16} />
        </Button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-carbon_black border border-carbon_black-600 rounded-lg shadow-2xl max-h-64 overflow-hidden">
          <div className="p-2 border-b border-carbon_black-600">
            <div className="relative">
              <Search01Icon
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-silver-400"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="pl-9 bg-onyx-600 border-carbon_black-700 text-white text-sm"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-silver-400">
                  No se encontraron resultados
                </p>
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full px-4 py-2.5 text-left hover:bg-onyx-600 transition-colors ${
                    value === option.id ? "bg-mahogany_red/20" : ""
                  }`}
                >
                  <p className="text-sm text-white font-medium">
                    {option.label}
                  </p>
                  {option.sublabel && (
                    <p className="text-xs text-silver-400">{option.sublabel}</p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
