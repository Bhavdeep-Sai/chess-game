import React from 'react';

const MoveIndicatorLegend = ({ show = true }) => {
  if (!show) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
      <h3 className="font-semibold text-gray-800 mb-3 text-sm">Move Indicators</h3>
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-300 border-2 border-blue-500 rounded flex-shrink-0"></div>
          <span className="text-gray-700">Selected piece</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
          <span className="text-gray-700">Available moves</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 border-2 border-red-600 flex-shrink-0"></div>
          <span className="text-gray-700">King in check</span>
        </div>
      </div>
      <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-600">
        <p>
          <svg className="w-4 h-4 inline-block mr-1 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Green squares show all possible moves!
        </p>
      </div>
    </div>
  );
};

export default MoveIndicatorLegend;
