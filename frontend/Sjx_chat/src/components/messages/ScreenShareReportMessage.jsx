import { useEffect, useState } from "react";
import { IoCheckmarkDone, IoTime } from "react-icons/io5";

const ScreenShareReportMessage = ({ message }) => {
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    try {
      // Parse the message content to extract screen share report
      if (message.content && typeof message.content === "string") {
        const jsonMatch = message.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          setReportData(data);
        }
      } else if (message.content && typeof message.content === "object") {
        setReportData(message.content);
      }
    } catch (error) {
      console.error("Error parsing screen share report:", error);
    }
  }, [message.content]);

  if (!reportData) return null;

  const getDurationColor = (seconds) => {
    if (seconds < 60) return "text-blue-600";
    if (seconds < 3600) return "text-green-600";
    return "text-purple-600";
  };

  const getReasonText = (reason) => {
    const reasons = {
      user_stopped: "Screen sharing ended",
      user_disconnected: "Screen sharing interrupted - user disconnected",
      initiator_disconnected: "Screen sharing interrupted - sharer disconnected",
      receiver_disconnected: "Screen sharing interrupted - viewer disconnected",
      normal_stop: "Screen sharing ended",
    };
    return reasons[reason] || "Screen sharing session completed";
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="flex items-center gap-3 my-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500 shadow-sm">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
          <IoTime className="text-blue-600 text-lg" />
        </div>
      </div>

      <div className="flex-grow">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-gray-700">
            Screen Share Session
          </span>
          <IoCheckmarkDone className="text-green-500 text-sm" />
        </div>

        <div className="text-xs text-gray-600 mb-2">
          {getReasonText(reportData.reason)}
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Duration:</span>
            <span className={`font-bold ${getDurationColor(reportData.duration)}`}>
              {reportData.durationFormatted || "0s"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-gray-600">Time:</span>
            <span className="text-gray-700">
              {formatTime(reportData.timestamp)}
            </span>
          </div>
        </div>

        {reportData.duration && (
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-500"
              style={{
                width: `${Math.min((reportData.duration / 600) * 100, 100)}%`,
              }}
            />
          </div>
        )}
      </div>

      <div className="flex-shrink-0">
        <div className="text-right">
          <div className={`text-lg font-bold ${getDurationColor(reportData.duration)}`}>
            {reportData.durationFormatted || "0s"}
          </div>
          <div className="text-xs text-gray-500">shared</div>
        </div>
      </div>
    </div>
  );
};

export default ScreenShareReportMessage;
// ```

// Now let me create a hook to handle screen share report messages:
