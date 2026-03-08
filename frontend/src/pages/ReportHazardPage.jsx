import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, UploadCloud, X, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { ReportService } from '../services/api';
import { Spinner } from '../components/ui/Spinner';
import { useLocationVerification } from '../hooks/useLocationVerification';
import CameraCapture from '../components/CameraCapture';

export default function ReportHazardPage() {
  const navigate = useNavigate();
  const { location, error: locationError, loading: locationLoading, requestLocation } = useLocationVerification();

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [status, setStatus] = useState('idle'); // idle | loading_backend | classification_done | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [classificationResult, setClassificationResult] = useState(null);
  const [finalReport, setFinalReport] = useState(null);

  // 1. Capture Live Photo
  const handleCapture = (file) => {
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      handleClassification(file);
    }
  };

  // 2. Classify Hazard (Photo + GPS verified)
  const handleClassification = async (fileToUpload) => {
    if (!location) {
      setErrorMsg('Location is required. Please enable GPS.');
      setStatus('error');
      return;
    }

    setStatus('loading_backend');
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('image', fileToUpload);
      formData.append('latitude', location.latitude);
      formData.append('longitude', location.longitude);
      
      // Use the newly split predict endpoint
      const data = await ReportService.predictHazard(formData);
      setClassificationResult(data);
      setStatus('classification_done');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to classify image. Please try again.');
      setStatus('error');
    }
  };

  // 3. Confirm and Submit Report
  const handleSubmitFinal = async () => {
    if (!classificationResult || !classificationResult.length || !location) return;

    setStatus('submitting');
    try {
      const results = [];
      for (const hazard of classificationResult) {
        if (hazard.hazard_type === 'none') continue;
        
        const payload = {
          image_url: hazard.image_url,
          hazard_type: hazard.hazard_type,
          severity_level: hazard.severity_level,
          repair_cost_estimate: hazard.estimated_repair_cost,
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: location.timestamp,
          road_type: 'city road'
        };

        const data = await ReportService.reportHazard(payload);
        results.push(data);
      }
      
      setFinalReport(results[0] || { status: 'submitted_multiple' });
      setStatus('success');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to submit final report. Please try again.');
      setStatus('error');
    }
  };

  // Retake photo / cancel
  const handleReset = () => {
    setImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setClassificationResult(null);
    setFinalReport(null);
    setStatus('idle');
    setErrorMsg('');
  };

  return (
    <div className="space-y-6 flex flex-col pb-6 animate-in fade-in zoom-in-95 duration-300 min-h-full">
      
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Report a Hazard</h2>
        <p className="text-gray-500 mt-1">Help make roads safer by reporting issues.</p>
      </div>

      {(errorMsg || locationError) && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 border border-red-100">
          <AlertOctagon className="shrink-0" />
          <p className="text-sm font-medium">{errorMsg || locationError}</p>
        </div>
      )}

      {/* SUCCESS STATE */}
      {status === 'success' && finalReport && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <CheckCircle2 size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Report Submitted!</h3>
            <p className="text-gray-500 text-sm mt-1">Status: {finalReport.status}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-primary-600 text-white font-bold py-3 rounded-xl hover:bg-primary-700 active:scale-95 transition-all"
          >
            Back to Home
          </button>
        </div>
      )}

      {/* CAPTURE AND VERIFICATION STATE */}
      {status !== 'success' && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4 flex flex-col flex-1">
          
          {/* STEP 1: GPS LOCATION REQUIRED */}
          <div className="bg-blue-50 p-4 rounded-xl flex items-center justify-between gap-3 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg shrink-0 ${location ? 'bg-green-100 text-green-600' : 'bg-blue-200 text-blue-700'}`}>
                {locationLoading ? <Spinner size="sm" /> : <MapPin size={20} />}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">Location Status</p>
                <p className={`text-sm font-bold ${location ? 'text-green-700' : 'text-blue-700'}`}>
                  {location ? 'Verified' : 'Required'}
                </p>
              </div>
            </div>
            {!location && (
              <button
                onClick={requestLocation}
                disabled={locationLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm active:scale-95 transition-all disabled:opacity-50"
              >
                Enable GPS
              </button>
            )}
          </div>

          {/* STEP 2: LIVE CAMERA CAPTURE (ONLY IF LOCATION ENABLED) */}
          <div className="flex-1 flex flex-col relative">
            {!location ? (
              <div className="flex-1 min-h-[250px] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-3 text-gray-400 bg-gray-50 p-6 text-center">
                <MapPin size={32} />
                <span className="font-medium">You must enable location to access the camera</span>
              </div>
            ) : !imagePreview ? (
              <CameraCapture onCapture={handleCapture} />
            ) : (
              <div className="relative w-full h-80 rounded-xl overflow-hidden bg-black group shadow-inner">
                <img src={imagePreview} alt="Captured preview" className="w-full h-full object-cover opacity-90" />
                <button 
                  onClick={handleReset}
                  disabled={status === 'loading_backend' || status === 'submitting'}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-all z-10 disabled:opacity-50"
                >
                  <X size={20} />
                </button>
                {status === 'loading_backend' && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center z-0">
                    <Spinner size="lg" className="text-white mb-4" />
                    <p className="font-bold text-lg">Analyzing Image...</p>
                    <p className="text-xs text-gray-300 mt-2">AI is identifying the hazard</p>
                  </div> 
                )}
              </div>
            )}
          </div>

          {/* STEP 3: CLASSIFICATION RESULT & CONFIRMATION */}
          {status === 'classification_done' && classificationResult && (
            <div className="space-y-3 animate-in fade-in duration-300">
              <h4 className="font-bold text-gray-900 border-b pb-2">
                {classificationResult.length} Hazard{classificationResult.length !== 1 ? 's' : ''} Detected
              </h4>
              
              {classificationResult.length === 1 && classificationResult[0].hazard_type === 'none' ? (
                <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-start gap-3 border border-green-100">
                  <CheckCircle2 className="shrink-0" />
                  <p className="text-sm font-medium">No road hazards detected in this image.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2">
                  {classificationResult.map((hazard, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-xl text-left space-y-3 border border-gray-100">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Type</span>
                        <span className="font-bold capitalize text-primary-700">{hazard.hazard_type.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Severity</span>
                        <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                          hazard.severity_level?.toUpperCase() === 'HIGH' ? 'bg-red-100 text-red-700' :
                          hazard.severity_level?.toUpperCase() === 'MEDIUM' ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {hazard.severity_level} (Score: {hazard.severity_score})
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Est. Repair Cost</span>
                        <span className="font-bold text-gray-900">₹{hazard.estimated_repair_cost?.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button 
            disabled={status !== 'classification_done' || (classificationResult?.length === 1 && classificationResult[0].hazard_type === 'none')}
            onClick={handleSubmitFinal}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all 
              ${status !== 'classification_done' || (classificationResult?.length === 1 && classificationResult[0].hazard_type === 'none')
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary-600 text-white shadow-md hover:bg-primary-700 active:scale-95'
              }
            `}
          >
            {status === 'submitting' ? (
              <>Submitting Report...</>
            ) : (
              <>
                <UploadCloud size={20} />
                Confirm & Submit
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
}
