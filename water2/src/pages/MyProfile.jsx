import React, { useState, useContext } from "react";
import axios from "axios";
import sha256 from "sha256";
import { AppContext } from "../context/AppContext";
import Sidebar from "../components/Sidebar";
import { Eye, EyeOff } from "lucide-react"; // For password visibility toggle
import jsPDF from "jspdf";
import "jspdf-autotable";
import { ethers } from "ethers";
import { contractABI } from "./constants"; // Ensure your contractABI is correctly imported

// Hardcoded values for local Hardhat (DO NOT use in production)
const PRIVATE_KEY = "0x8166f546bab6da521a8369cab06c5d2b9e46670292d85c875ee9ec20e84ffb61";
const PROVIDER_URL = "http://127.0.0.1:8545";
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Your deployed contract address

const MyProfile = () => {
  const { user, setUser } = useContext(AppContext);
  const [formData, setFormData] = useState({
    email: user?.email || "",
    password: user?.password || "",
    gender: user?.gender || "",
    dob: user?.dob || "",
    phone: user?.phone || "",
    bloodGroup: user?.bloodGroup || "",
    age: user?.age || "",
    emergencyContact: user?.emergencyContact || "",
    allergies: user?.allergies || "",
    vaccinationHistory: user?.vaccinationHistory || "",
    healthInsurancePolicy: user?.healthInsurancePolicy || "",
    doctorAssigned: user?.doctorAssigned || "",
  });
  const [prescriptionImage, setPrescriptionImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false); // For password visibility toggle

  // PDF download URL from profile update (optional)
  const [pdfUrl, setPdfUrl] = useState(null);
  // PDF record returned from blockchain storage (only the one from this update)
  const [pdfRecord, setPdfRecord] = useState(null);
  // For blockchain
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);

  // Generate PDF from user data
  const generatePDF = (data) => {
    const doc = new jsPDF();
    doc.text("User Profile", 14, 15);

    const tableColumn = ["Field", "Value"];
    const tableRows = [];

    Object.entries(data).forEach(([key, value]) => {
      tableRows.push([key, value]);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    // Return the pdf as a Blob URL (for download) and as an ArrayBuffer (for hashing)
    const pdfBlob = doc.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);
    const pdfArrayBuffer = doc.output("arraybuffer");

    return { blobUrl, pdfArrayBuffer };
  };

  // Profile update submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setPdfUrl(null);
    setPdfRecord(null);

    const submitData = new FormData();
    Object.keys(formData).forEach((key) => {
      submitData.append(key, formData[key]);
    });
    if (prescriptionImage) {
      submitData.append("prescriptionImage", prescriptionImage);
    }

    try {
      const response = await axios.put(
        "http://localhost:4000/api/user/update",
        submitData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.data.success) {
        // Update user context with new data
        setUser(response.data.user);
        alert("Profile updated successfully");

        // Generate PDF using updated user data
        const { blobUrl, pdfArrayBuffer } = generatePDF(response.data.user);
        setPdfUrl(blobUrl);

        // Now process the PDF: hash, upload to IPFS, and store on blockchain
        await handleStorePdf(pdfArrayBuffer);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  // Function to connect wallet and initialize contract
  const connectWallet = async () => {
    try {
      const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
      setAccount(wallet.address);
      console.log("Connected with wallet:", wallet.address);

      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractABI,
        wallet
      );
      setContract(contractInstance);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  // Called automatically when component mounts
  React.useEffect(() => {
    connectWallet();
  }, []);

  // Function to generate SHA-256 hash, upload PDF to IPFS, and store record on blockchain
  const handleStorePdf = async (pdfArrayBuffer) => {
    try {
      // 1. Compute SHA‑256 hash of the PDF binary
      const pdfHash = sha256(pdfArrayBuffer);

      // 2. Convert the ArrayBuffer to a Blob and then to a File
      const pdfBlob = new Blob([pdfArrayBuffer], { type: "application/pdf" });
      const pdfFile = new File([pdfBlob], "profile.pdf", {
        type: "application/pdf",
      });

      // 3. Upload the PDF File to IPFS using Pinata
      const pdfFormData = new FormData();
      pdfFormData.append("file", pdfFile);

      const ipfsResponse = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        pdfFormData,
        {
          headers: {
            pinata_api_key: import.meta.env.VITE_PINATA_API_KEY,
            pinata_secret_api_key: import.meta.env.VITE_PINATA_SECRET_API_KEY,
          },
        }
      );
      const pdfIpfsHash = ipfsResponse.data.IpfsHash;
      alert(`PDF uploaded successfully.\nIPFS Hash: ${pdfIpfsHash}`);

      // 4. Store the PDF's SHA‑256 hash and IPFS hash on the blockchain using the existing function
      if (contract) {
        try {
          const tx = await contract.storeFile(pdfHash, pdfIpfsHash);
          await tx.wait();
          alert("PDF record stored on blockchain successfully!");

          // Since you want to display only the PDF record from this update,
          // we simply update our local state with the new record.
          setPdfRecord({ sha256: pdfHash, ipfs: pdfIpfsHash });
        } catch (blockchainError) {
          console.error("Error storing PDF record on blockchain:", blockchainError);
          alert("Failed to store PDF record on blockchain!");
        }
      } else {
        alert("Contract is not available. Please connect your wallet.");
      }
    } catch (err) {
      console.error("Error processing PDF:", err);
      alert("An error occurred during PDF processing.");
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
            My Profile
          </h2>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:bg-gray-50 hover:bg-gray-50 transition-colors"
                  autoComplete="email"
                  required
                />
              </div>

              {/* Password */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:bg-gray-50 hover:bg-gray-50 transition-colors"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-500" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Gender Dropdown */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:bg-gray-50 hover:bg-gray-50 transition-colors"
                  required
                >
                  <option value="" disabled>
                    Select your gender
                  </option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              {/* Phone Number */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:bg-gray-50 hover:bg-gray-50 transition-colors"
                  placeholder="Enter your phone number"
                  autoComplete="tel"
                  required
                />
              </div>

              {/* Blood Group */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Blood Group
                </label>
                <input
                  type="text"
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={(e) =>
                    setFormData({ ...formData, bloodGroup: e.target.value })
                  }
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:bg-gray-50 hover:bg-gray-50 transition-colors"
                  placeholder="Enter your blood group"
                  autoComplete="off"
                  required
                />
              </div>

              {/* Age */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:bg-gray-50 hover:bg-gray-50 transition-colors"
                  placeholder="Enter your age"
                  autoComplete="off"
                  required
                />
              </div>

              {/* Other Fields */}
              {Object.keys(formData)
                .filter((field) =>
                  ![
                    "email",
                    "password",
                    "gender",
                    "phone",
                    "bloodGroup",
                    "age",
                  ].includes(field)
                )
                .map((field) => (
                  <div key={field} className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2 capitalize">
                      {field.replace(/([A-Z])/g, " $1")}
                    </label>
                    <input
                      type={field === "dob" ? "date" : "text"}
                      name={field}
                      value={formData[field]}
                      onChange={(e) =>
                        setFormData({ ...formData, [field]: e.target.value })
                      }
                      className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:bg-gray-50 hover:bg-gray-50 transition-colors"
                      autoComplete="off"
                      required
                    />
                  </div>
                ))}
            </div>

            {/* Prescription Image Upload */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Prescription Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPrescriptionImage(e.target.files[0])}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:bg-gray-50 hover:bg-gray-50 transition-colors"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Updating..." : "Update Profile"}
            </button>
          </form>

          {/* PDF Download Link (if generated) */}
          {pdfUrl && (
            <div className="mt-4 text-center">
              <a
                href={pdfUrl}
                download="profile.pdf"
                className="inline-block bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Download PDF
              </a>
            </div>
          )}

          {/* New Section: Display PDF record stored on blockchain */}
          {/* {pdfRecord && (
            <div className="mt-8 p-4 border rounded shadow-md">
              <h3 className="text-xl font-bold mb-4 text-center">
                PDF Record on Blockchain
              </h3>
              <p>
                <strong>SHA‑256 Hash:</strong> {pdfRecord.sha256}
              </p>
              <p>
                <strong>IPFS Hash:</strong> {pdfRecord.ipfs}
              </p>
              <a
                href={`https://gateway.pinata.cloud/ipfs/${pdfRecord.ipfs}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Download PDF from IPFS
              </a>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
