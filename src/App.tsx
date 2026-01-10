import { useAppState } from './hooks/useAppState';
import { UploadPage } from './components/UploadPage';
import { DashboardPage } from './components/DashboardPage';
import { AuditPage } from './components/AuditPage';
import './App.css';

function App() {
  const {
    uploadedFiles,
    cycles,
    selectedCycle,
    setSelectedCycle,
    processingResult,
    isProcessing,
    currentView,
    setCurrentView,
    mappingModalOpen,
    setMappingModalOpen,
    mappingModalFile,
    setMappingModalFile,
    handleFileUpload,
    handleManualMapping,
    processAllData,
    clearFile,
    resetAll,
    canProcess
  } = useAppState();

  return (
    <div className="app">
      {currentView === 'upload' && (
        <UploadPage
          uploadedFiles={uploadedFiles}
          cycles={cycles}
          selectedCycle={selectedCycle}
          onCycleChange={setSelectedCycle}
          onFileUpload={handleFileUpload}
          onClearFile={clearFile}
          onProcess={processAllData}
          canProcess={canProcess}
          isProcessing={isProcessing}
          mappingModalOpen={mappingModalOpen}
          mappingModalFile={mappingModalFile}
          onOpenMappingModal={(key) => {
            setMappingModalFile(key);
            setMappingModalOpen(true);
          }}
          onCloseMappingModal={() => {
            setMappingModalOpen(false);
            setMappingModalFile(null);
          }}
          onSaveMapping={handleManualMapping}
        />
      )}

      {currentView === 'dashboard' && processingResult && (
        <DashboardPage
          result={processingResult}
          onGoToUpload={resetAll}
          onGoToAudit={() => setCurrentView('audit')}
        />
      )}

      {currentView === 'audit' && processingResult && (
        <AuditPage
          audit={processingResult.audit}
          onGoToDashboard={() => setCurrentView('dashboard')}
          onGoToUpload={resetAll}
        />
      )}
    </div>
  );
}

export default App;
