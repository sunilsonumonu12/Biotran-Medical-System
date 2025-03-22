import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import Skeleton from "react-loading-skeleton";
import { 
  User, 
  Phone, 
  MapPin, 
  Briefcase as BriefcaseMedical, 
  FileCheck, 
  AlertCircle 
} from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import AppContext (ensure you have created this context and wrap your app with its provider)
import { AppContext } from "../context/AppContext";

// Fallback dummy user for development if context isn't ready
const dummyUser = {
  email: "sunil@example.com",
  name: "Sunil",
};

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function PatientDashboard() {
  const { user: contextUser } = useContext(AppContext);
  const currentUserEmail = contextUser?.email || dummyUser.email;
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get("http://localhost:4000/api/user/get-users");
        const fetchedUsers = response.data.users;
        const currentUser = fetchedUsers.find((u) => u.email === currentUserEmail);
        
        if (currentUser) {
          setUser(currentUser);
        } else {
          throw new Error("User not found");
        }
      } catch (err) {
        setError("We're having trouble fetching your information. Please try again.");
        toast.error("Unable to load your dashboard. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUserEmail]);6

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4 mb-8">
              <Skeleton circle width={96} height={96} />
              <div className="flex-1">
                <Skeleton height={32} width={200} />
                <Skeleton height={20} width={150} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <Skeleton height={24} width={150} className="mb-4" />
                  <Skeleton count={3} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
        <div className="min-h-screen flex bg-white">
          <Sidebar />
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-6 lg:p-8"
      initial="initial"
      animate="animate"
      variants={fadeIn}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="bg-white rounded-xl shadow-xl overflow-hidden"
          variants={fadeIn}
        >
          {/* Header Section */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-90" />
            <div className="relative p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden flex-shrink-0">

            <img 
          src={
            user?.image?.mimeType && user?.image?.base64
              ? `data:${user.image.mimeType};base64,${user.image.base64}`
              : assets.profile_pic
          }
          alt="Profile" 
          className="w-full h-full object-cover"
        />

              </div>
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-bold text-white mb-2">{user?.name}</h2>
                <p className="text-blue-100">{user?.email}</p>
                <div className="mt-4">
                  <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">
                    Welcome back! Here's your latest medical information.
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <motion.div 
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Basic Information</h3>
              </div>
              <div className="space-y-3">
                <p className="text-gray-600">
                  <span className="font-medium">Name:</span> {user?.name}
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-medium">Blood Group:</span>
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                    {user?.bloodGroup}
                  </span>
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Age:</span> {user?.age}
                </p>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
      <p className="text-gray-700 font-medium mb-2">Assigned Doctor</p>
      {user?.doctorAssigned?.name ? (
        <div>
          <p className="text-gray-600">
            <span className="font-medium">Name:</span> {user.doctorAssigned.name}
          </p>
          <p className="text-gray-600 text-sm">
            <span className="font-medium">Email:</span> {user.doctorAssigned.email}
          </p>
        </div>
      ) : (
        <p className="text-gray-500 italic">No doctor assigned</p>
      )}
    </div>
              </div>
            </motion.div>

            {/* Contact Details */}
            <motion.div 
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Phone className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Contact Details</h3>
              </div>
              <div className="space-y-3">
                <p className="text-gray-600">
                  <span className="font-medium">Email:</span> {user?.email}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Phone:</span> {user?.phone}
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-medium">Emergency Contact:</span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                    {user?.emergencyContact}
                  </span>
                </p>
              </div>
            </motion.div>

            {/* Address Information */}
            <motion.div 
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MapPin className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Address Information</h3>
              </div>
              <div className="space-y-3">
                <p className="text-gray-600">
                  <span className="font-medium">City:</span> {user?.city || "N/A"}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">State:</span> {user?.state || "N/A"}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Country:</span> {user?.country || "N/A"}
                </p>
              </div>
            </motion.div>

            {/* Medical Documents */}
            <motion.div 
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <BriefcaseMedical className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Medical Documents</h3>
              </div>
              <div className="space-y-4">
                {user?.documents?.prescription?.fileName && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileCheck className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Prescription</span>
                    </div>
                    <button
                      onClick={() => window.open(user.documents.prescription.url, "_blank")}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      aria-label="View prescription"
                    >
                      View
                    </button>
                  </div>
                )}
                {user?.documents?.medicalReport?.fileName && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileCheck className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Medical Report</span>
                    </div>
                    <button
                      onClick={() => window.open(user.documents.medicalReport.url, "_blank")}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      aria-label="View medical report"
                    >
                      View
                    </button>
                  </div>
                )}
                {user?.documents?.insurance?.fileName && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileCheck className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Insurance Policy</span>
                    </div>
                    <button
                      onClick={() => window.open(user.documents.insurance.url, "_blank")}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      aria-label="View insurance policy"
                    >
                      View
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
</div>
);
}