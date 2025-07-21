import React, { useState } from "react";

const CollapsibleSection = ({ title, children, startOpen = false }) => {
  const [isOpen, setIsOpen] = useState(startOpen);

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className="mb-6 border border-red-200 rounded-xl bg-red-50/20 shadow-lg overflow-hidden">
      <button
        onClick={toggleOpen}
        className="w-full flex justify-between items-center text-left p-4 bg-red-100 hover:bg-red-200 focus:outline-none transition-colors duration-200"
      >
        <h3 className="text-xl font-bold text-red-800">{title}</h3>
        {/* Simple +/- indicator */}
        <span className="text-2xl font-semibold text-red-600">
          {isOpen ? "−" : "+"}
        </span>
      </button>
      {/* Content area that animates open/close */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? "max-h-[2000px]" : "max-h-0"
        }`}
      >
        <div className="p-6 bg-white border-t border-red-200">{children}</div>
      </div>
    </div>
  );
};

export default CollapsibleSection;
