import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Upload, ClipboardList, ChevronDown } from "lucide-react";
import Sidebar from "../components/Sidebar";

const inputVariants = {
    focus: { scale: 0.98 },
    blur: { scale: 1 },
};

export default function Medical() {
  const [formData, setFormData] = useState({
    medicalReport: null,
    prescription: null,
    insuranceCard: null,
  });
  
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: files[0],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Here you would typically send the data to a server
  };

  return (
    <div className="min-h-screen flex bg-white">
      <Sidebar />
      <div className="flex-1 p-8">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Upload Medical Documents</h2>
          <div className="grid grid-cols-1 gap-6">
            <FileUploadField
              icon={<FileText />}
              name="medicalReport"
              label="Medical Report"
              onChange={handleFileChange}
            />
            <FileUploadField
              icon={<ClipboardList />}
              name="prescription"
              label="Prescription"
              onChange={handleFileChange}
            />
            <FileUploadField
              icon={<Upload />}
              name="insuranceCard"
              label="Insurance Card"
              onChange={handleFileChange}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out"
          >
            Submit Documents
          </motion.button>
        </form>
      </div>
    </div>
  );
}

function FileUploadField({ icon, name, label, onChange }) {
  return (
    <div className="relative">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative rounded-md shadow-sm flex items-center border border-gray-300 p-2 rounded-md">
        <div className="mr-3 text-gray-400">{icon}</div>
        <input
          type="file"
          name={name}
          id={name}
          onChange={onChange}
          className="block w-full text-base text-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
    </div>
  );
}
