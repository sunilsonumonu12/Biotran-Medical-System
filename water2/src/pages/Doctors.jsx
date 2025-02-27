import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const Doctors = () => {
  const { speciality } = useParams();
  const [filterDoc, setFilterDoc] = useState([]);
  const { doctors } = useContext(AppContext);
  const navigate = useNavigate();

  const applyFilter = () => {
    if (speciality) {
      setFilterDoc(doctors.filter(doc => doc.speciality === speciality));
    } else {
      setFilterDoc(doctors);
    }
  };

  useEffect(() => {
    if (doctors) {
      console.log('useEffect triggered'); // Debugging useEffect trigger
      applyFilter();
    }
  }, [doctors, speciality]);

  if (!doctors) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <p className="text-xl font-bold text-gray-700 mb-4">Browse through the doctors specialist.</p>

      {/* Flexbox layout for <p> tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          'General physician',
          'Gynecologist',
          'Dermatologist',
          'Pediatricians',
          'Neurologist',
          'Gastroenterologist',
        ].map((spec, index) => (
          <p
            key={index}
            onClick={() =>
              speciality === spec ? navigate('/doctors') : navigate(`/doctors/${spec}`)
            }
            className={`px-4 py-2 border rounded cursor-pointer transition-all hover:bg-indigo-200 hover:text-white ${
              speciality === spec ? 'bg-indigo-100 text-black' : 'border-gray-300 text-gray-700'
            }`}
          >
            {spec}
          </p>
        ))}
      </div>

      {/* Flexbox layout for doctor cards */}
      <div className="flex flex-wrap gap-4 justify-center">
        {filterDoc.map((doctor, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-2 transform transition duration-300 cursor-pointer outline outline-2 outline-blue-300 w-[250px] h-[350px] flex-shrink-0"
          >
            <div className="relative bg-blue-100 h-[200px] rounded-t-2xl flex items-center justify-center overflow-hidden">
              <img
                src={doctor.image}
                alt={doctor.name}
                className="w-full h-full object-cover rounded-t-2xl"
              />
            </div>
            <div className="p-4 text-center">
              <p
                className={`font-semibold text-xl flex items-center justify-center ${
                  doctor.isAvailable ? 'text-red-500' : 'text-green-500'
                } mb-2`}
              >
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Available
              </p>
              <p className="font-bold text-xl">{doctor.name}</p>
              <p className="text-lg text-gray-500">{doctor.speciality}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Doctors;
