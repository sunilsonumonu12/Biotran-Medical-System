import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

export default function DoctorDropdown() {
  const { user, setUser, token } = useContext(AppContext);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        if (!token) {
          throw new Error("No authentication token found");
        }
        const response = await axios.get("http://localhost:4000/api/doctor/all", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data && Array.isArray(response.data.doctors)) {
          setDoctors(response.data.doctors);
        }
      } catch (error) {
        console.error("Error fetching doctors:", error);
        toast.error("Failed to load doctors");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [token]);

  const handleDoctorSelect = async (e) => {
    const doctorEmail = e.target.value;
    setSelectedDoctor(doctorEmail);
  
    if (!doctorEmail) {
      toast.warning("Please select a doctor");
      return;
    }
  
    if (!user || !user.email) {
      toast.error("Please login to assign a doctor");
      navigate("/login");
      return;
    }
  
    try {
      const selectedDoc = doctors.find(doc => doc.email === doctorEmail);
      
      if (!selectedDoc) {
        toast.error("Selected doctor not found");
        return;
      }

      const response = await axios.post(
        "http://localhost:4000/api/doctor/assign",
        { 
          userEmail: user.email,
          doctorEmail: doctorEmail
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      if (response.data.success) {
        setUser({
          ...user,
          doctorAssigned: {
            name: selectedDoc.name,
            email: selectedDoc.email
          }
        });
        toast.success("Doctor assigned successfully!");
      }
    } catch (error) {
      console.error("Error assigning doctor:", error);
      toast.error(error.response?.data?.message || "Failed to assign doctor");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Current User Information</h2>
        {user ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">
                <span className="font-medium">Name:</span> {user.name}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Current Doctor:</span>{" "}
                {user.doctorAssigned ? `${user.doctorAssigned.name} (${user.doctorAssigned.email})` : "None"}
              </p>
            </div>
            {/* ...rest of the user info display... */}
          </div>
        ) : (
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-600">User data not available. Please log in.</p>
            <button
              onClick={() => navigate("/login")}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>

      {user && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Select Your Doctor</h2>
          <select
            value={selectedDoctor}
            onChange={handleDoctorSelect}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select a Doctor --</option>
            {doctors.map((doc) => (
              <option key={doc.email} value={doc.email}>
                {doc.name} - {doc.speciality} ({doc.email})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}