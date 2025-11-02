exports.getAnalytics = async (req, res) => {
  // Example: return dummy analytics data
  res.json({
    totalConsultations: 120,
    avgConsultationTime: 15,
    staffPerformance: [
      { staffId: '1', score: 90 },
      { staffId: '2', score: 85 }
    ]
  });
};