"use client";

import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Award,
  AlertTriangle
} from "lucide-react";

const ApplicationStatusBadge = ({ status }) => {
  // Define status configurations
  const statusConfig = {
    Pending: {
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: <Clock size={14} className="mr-1" />,
      label: "Pending"
    },
    Reviewed: {
      color: "bg-purple-100 text-purple-800 border-purple-200",
      icon: <User size={14} className="mr-1" />,
      label: "Reviewed"
    },
    Shortlisted: {
      color: "bg-green-100 text-green-800 border-green-200",
      icon: <CheckCircle size={14} className="mr-1" />,
      label: "Shortlisted"
    },
    Rejected: {
      color: "bg-red-100 text-red-800 border-red-200",
      icon: <XCircle size={14} className="mr-1" />,
      label: "Rejected"
    },
    Hired: {
      color: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: <Award size={14} className="mr-1" />,
      label: "Hired"
    },
    Withdrawn: {
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: <AlertTriangle size={14} className="mr-1" />,
      label: "Withdrawn"
    }
  };

  // Default to Pending if status is not recognized
  const config = statusConfig[status] || statusConfig.Pending;

  return (
    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${config.color} flex items-center`}>
      {config.icon}
      {config.label}
    </div>
  );
};

export default ApplicationStatusBadge;
