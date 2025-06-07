'use client';

export function SimpleRecommendations({ data }: { data: any }) {
  console.log('🚨 SIMPLE RECOMMENDATIONS COMPONENT MOUNTED');
  console.log('🚨 Data received:', data);
  
  // Hardcoded test data to verify rendering works
  const testRecommendations = [
    {
      id: '1',
      title: 'Fix Missing H1 Tag',
      priority: 89,
      category: 'technical',
      description: 'Your page is missing an H1 tag which is critical for SEO',
      impact: {
        seoScore: 8,
        timeToImplement: 5,
        implementationEffort: 'low'
      }
    },
    {
      id: '2',
      title: 'Add Meta Description',
      priority: 75,
      category: 'meta',
      description: 'Missing meta description reduces click-through rates',
      impact: {
        seoScore: 6,
        timeToImplement: 3,
        implementationEffort: 'low'
      }
    },
    {
      id: '3',
      title: 'Optimize Images with Alt Text',
      priority: 65,
      category: 'accessibility',
      description: '12 images are missing alt text',
      impact: {
        seoScore: 6,
        timeToImplement: 8,
        implementationEffort: 'low'
      }
    }
  ];

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#ff0000', 
      color: 'white',
      border: '5px solid yellow',
      margin: '10px'
    }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
        🚨 SIMPLE RECOMMENDATIONS TEST - {testRecommendations.length} Items
      </h1>
      
      <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '10px', marginBottom: '20px' }}>
        <p><strong>Component Status:</strong> ✅ MOUNTED AND RENDERING</p>
        <p><strong>Data Passed:</strong> {data ? 'YES' : 'NO'}</p>
        <p><strong>Data Type:</strong> {typeof data}</p>
        <p><strong>Is Array:</strong> {Array.isArray(data) ? 'YES' : 'NO'}</p>
        <p><strong>Data Length:</strong> {data?.length || 'N/A'}</p>
      </div>
      
      {/* HARDCODED TEST RECOMMENDATIONS */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>🔥 HARDCODED TEST RECOMMENDATIONS:</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {testRecommendations.map((rec) => (
            <div 
              key={rec.id} 
              style={{ 
                backgroundColor: 'white', 
                color: 'black',
                padding: '15px', 
                borderRadius: '8px',
                border: '2px solid #0066cc'
              }}
            >
              <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '5px' }}>
                {rec.title}
              </h3>
              <p style={{ margin: '5px 0', color: '#666' }}>Priority: {rec.priority}</p>
              <p style={{ margin: '5px 0' }}>{rec.description}</p>
              <p style={{ margin: '5px 0', fontSize: '14px', color: '#0066cc' }}>
                Impact: {rec.impact.seoScore}/10 | Time: {rec.impact.timeToImplement}min | Effort: {rec.impact.implementationEffort}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* PASSED DATA DISPLAY */}
      <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '5px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>📋 RAW DATA PASSED TO COMPONENT:</h2>
        <pre style={{ 
          backgroundColor: 'black', 
          color: '#00ff00', 
          padding: '10px', 
          borderRadius: '3px',
          overflow: 'auto',
          fontSize: '12px',
          maxHeight: '300px'
        }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
      
      {/* ACTUAL DATA RENDERING */}
      {Array.isArray(data) && data.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>🎯 ACTUAL DATA RENDERING:</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.map((item, i) => (
              <div 
                key={i} 
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.9)', 
                  color: 'black',
                  padding: '10px', 
                  borderRadius: '5px',
                  border: '1px solid #ccc'
                }}
              >
                <strong>{item.title || item.recommendation || `Item ${i + 1}`}</strong>
                <p style={{ fontSize: '14px', margin: '5px 0' }}>
                  {item.description || JSON.stringify(item)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}