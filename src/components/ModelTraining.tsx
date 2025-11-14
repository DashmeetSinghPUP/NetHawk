import React, { useState } from 'react';
import { Settings, Brain, TrendingUp, Database, Play, Pause } from 'lucide-react';

interface ModelTrainingProps {
  accuracy: number;
  totalPackets: number;
}

export default function ModelTraining({ accuracy, totalPackets }: ModelTrainingProps) {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);

  const startTraining = () => {
    setIsTraining(true);
    setTrainingProgress(0);
    
    // Simulate training progress
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 500);
  };

  const modelMetrics = {
    precision: 0.947,
    recall: 0.923,
    f1Score: 0.935,
    falsePositiveRate: 0.053
  };

  const featureImportance = [
    { feature: 'Source IP Reputation', importance: 0.23 },
    { feature: 'Packet Size', importance: 0.19 },
    { feature: 'Port Number', importance: 0.17 },
    { feature: 'Protocol Type', importance: 0.15 },
    { feature: 'TTL Value', importance: 0.12 },
    { feature: 'Flags Pattern', importance: 0.14 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Machine Learning Model</h2>
            <p className="text-gray-400">Random Forest Classifier for Intrusion Detection</p>
          </div>
        </div>
        
        <button
          onClick={startTraining}
          disabled={isTraining}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
            isTraining 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {isTraining ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{isTraining ? 'Training...' : 'Retrain Model'}</span>
        </button>
      </div>

      {/* Model Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Accuracy</p>
              <p className="text-2xl font-bold text-green-400">{accuracy}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Precision</p>
              <p className="text-2xl font-bold text-blue-400">{(modelMetrics.precision * 100).toFixed(1)}%</p>
            </div>
            <Settings className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Recall</p>
              <p className="text-2xl font-bold text-purple-400">{(modelMetrics.recall * 100).toFixed(1)}%</p>
            </div>
            <Brain className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Training Data</p>
              <p className="text-2xl font-bold text-orange-400">{totalPackets.toLocaleString()}</p>
            </div>
            <Database className="w-8 h-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Training Progress */}
      {isTraining && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Training Progress</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Model Training</span>
              <span className="text-white font-bold">{trainingProgress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${trainingProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-400">
              Training Random Forest classifier with {totalPackets.toLocaleString()} samples...
            </p>
          </div>
        </div>
      )}

      {/* Model Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Model Configuration</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <span className="text-gray-300">Algorithm</span>
                <span className="text-white font-medium">Random Forest</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <span className="text-gray-300">Estimators</span>
                <span className="text-white font-medium">100</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <span className="text-gray-300">Max Depth</span>
                <span className="text-white font-medium">10</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <span className="text-gray-300">Features</span>
                <span className="text-white font-medium">{featureImportance.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <span className="text-gray-300">Threshold</span>
                <span className="text-white font-medium">0.7</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Performance Metrics</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <span className="text-gray-300">F1-Score</span>
                <span className="text-green-400 font-bold">{(modelMetrics.f1Score * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <span className="text-gray-300">False Positive Rate</span>
                <span className="text-orange-400 font-bold">{(modelMetrics.falsePositiveRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <span className="text-gray-300">Last Trained</span>
                <span className="text-white font-medium">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <span className="text-gray-300">Model Size</span>
                <span className="text-white font-medium">2.4 MB</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <span className="text-gray-300">Inference Time</span>
                <span className="text-white font-medium">0.3ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Importance */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Feature Importance</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {featureImportance.map((feature, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">{feature.feature}</span>
                  <span className="text-white font-bold">{(feature.importance * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
                    style={{ width: `${feature.importance * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Training History */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Training History</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div>
                <p className="text-white font-medium">Model v2.1</p>
                <p className="text-sm text-gray-400">Trained with 50,000 samples</p>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-bold">94.7%</p>
                <p className="text-xs text-gray-400">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div>
                <p className="text-white font-medium">Model v2.0</p>
                <p className="text-sm text-gray-400">Trained with 45,000 samples</p>
              </div>
              <div className="text-right">
                <p className="text-blue-400 font-bold">93.2%</p>
                <p className="text-xs text-gray-400">1 day ago</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div>
                <p className="text-white font-medium">Model v1.9</p>
                <p className="text-sm text-gray-400">Trained with 40,000 samples</p>
              </div>
              <div className="text-right">
                <p className="text-orange-400 font-bold">91.8%</p>
                <p className="text-xs text-gray-400">3 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}