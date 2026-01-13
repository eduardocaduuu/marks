import { useAppState } from './hooks/useAppState';
import { UploadPage } from './components/UploadPage';
import { DashboardPage } from './components/DashboardPage';
import { AuditPage } from './components/AuditPage';
import { GeralDashboardPage } from './components/GeralDashboardPage';
import './App.css';

function App() {
  const {
    uploadedFiles,
    cycles,
    selectedCycle,
    setSelectedCycle,
    processingResult,
    geralOnlyResult,
    analysisMode,
    setAnalysisMode,
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
    processGeralOnlyData,
    clearFile,
    resetAll,
    canProcess,
    canProcessGeralOnly
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
          onProcessGeralOnly={processGeralOnlyData}
          canProcess={canProcess}
          canProcessGeralOnly={canProcessGeralOnly}
          isProcessing={isProcessing}
          analysisMode={analysisMode}
          onAnalysisModeChange={setAnalysisMode}
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

      {currentView === 'geral-dashboard' && geralOnlyResult && (
        <GeralDashboardPage
          result={geralOnlyResult}
          onGoToUpload={resetAll}
        />
      )}
    </div>
  );
}

export default App;
