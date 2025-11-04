
import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface CalendarProps {
  selectedDates: Date[];
  onDateChange: (dates: Date[]) => void;
}

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const Calendar: React.FC<CalendarProps> = ({ selectedDates, onDateChange }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleDateClick = (day: Date) => {
    const existingIndex = selectedDates.findIndex(d => isSameDay(d, day));
    let newDates: Date[];
    if (existingIndex > -1) {
      newDates = selectedDates.filter((_, index) => index !== existingIndex);
    } else {
      newDates = [...selectedDates, day];
    }
    onDateChange(newDates.sort((a, b) => a.getTime() - b.getTime()));
  };

  const changeMonth = (amount: number) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setDate(1); // Avoid month skipping issues
      newDate.setMonth(prev.getMonth() + amount);
      return newDate;
    });
  };

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-4">
      <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
        <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
      </button>
      <h3 className="text-lg font-semibold text-gray-800">
        {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
      </h3>
      <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
        <ChevronRightIcon className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  );

  const renderDaysOfWeek = () => {
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    return (
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 mb-2">
        {days.map(day => <div key={day}>{day}</div>)}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - monthStart.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
        days.push(new Date(startDate));
        startDate.setDate(startDate.getDate() + 1);
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const isCurrentMonth = d.getMonth() === currentMonth.getMonth();
          const isSelected = selectedDates.some(selected => isSameDay(selected, d));
          const isToday = isSameDay(d, new Date());
          
          let cellClasses = "flex items-center justify-center h-9 w-9 rounded-full text-sm cursor-pointer transition-all duration-200 ";

          if (!isCurrentMonth) {
            cellClasses += "text-gray-300 cursor-default";
          } else {
             if (isSelected) {
              cellClasses += "bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700";
            } else if (isToday) {
              cellClasses += "bg-indigo-100 text-indigo-700 font-semibold";
            } else {
              cellClasses += "text-gray-700 hover:bg-gray-100";
            }
          }

          return (
            <div
              key={i}
              className={cellClasses}
              onClick={() => isCurrentMonth && handleDateClick(d)}
            >
              {d.getDate()}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      {renderHeader()}
      {renderDaysOfWeek()}
      {renderCells()}
    </div>
  );
};
