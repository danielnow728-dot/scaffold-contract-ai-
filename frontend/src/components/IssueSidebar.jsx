import React from 'react';

const IssueSidebar = ({ issues = [], financials = null }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>
      
      {/* Financials Summary */}
      {financials && (
         <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '16px' }}>
            
            {/* Core Business Terms */}
            {financials.contract_value && (
              <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)', color: 'white' }}>
                 <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, marginBottom: '8px' }}>Total Contract Value</div>
                 <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{financials.contract_value}</div>
              </div>
            )}
            
            {financials.payment_terms && (
              <div className="glass-panel" style={{ padding: '24px', background: 'rgba(255,255,255,0.85)' }}>
                 <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Payment Terms</div>
                 <div style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>{financials.payment_terms}</div>
              </div>
            )}
            
            {financials.retainage && (
              <div className="glass-panel" style={{ padding: '24px', background: 'rgba(255,255,255,0.85)' }}>
                 <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Retainage / Withholding</div>
                 <div style={{ color: 'var(--danger-color)', fontSize: '1.5rem', fontWeight: 'bold' }}>{financials.retainage}</div>
              </div>
            )}
            
            {/* Other Financials */}
            {financials.other && financials.other.length > 0 && (
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', gridColumn: '1 / -1' }}>
                <h5 style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem', textTransform: 'uppercase' }}>Additional Extracted Financials</h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {financials.other.map((f, i) => (
                    <div key={i} style={{ background: '#ffffff', padding: '8px 16px', borderRadius: '20px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)', marginRight: '8px' }}>{f.item}:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{f.amount}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
         </div>
      )}

      {/* Identified Issues Grid */}
      <div>
        <h4 style={{ marginBottom: '20px', color: 'var(--text-primary)', fontSize: '1.25rem' }}>Automated Risk Analysis</h4>
        {issues.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No scaffolding rules were violated in this contract chunk.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '24px' }}>
            {issues.map((issue, idx) => (
              <div key={idx} className="glass-panel animate-fade-in" style={{ 
                display: 'flex', flexDirection: 'column', padding: '24px', 
                borderTop: '5px solid var(--primary-color)' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <h5 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0, paddingRight: '10px' }}>{issue.category}</h5>
                </div>
                
                {/* Contract Context */}
                <div style={{ background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--accent-color)', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contract Text</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{issue.location}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontStyle: 'italic', margin: 0, lineHeight: '1.5' }}>"{issue.original_text}"</p>
                </div>

                {/* AI Explanation */}
                <div style={{ marginBottom: '24px', flex: 1 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', letterSpacing: '0.5px' }}>Einstein's Analysis</span>
                  <p style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0, lineHeight: '1.6' }}>{issue.explanation}</p>
                </div>
                
                {/* Proposed Redlines */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                  {issue.option_a_text && issue.option_a_text !== "[DELETE ENTIRELY]" && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '14px', borderRadius: '8px' }}>
                      <strong style={{ fontSize: '0.8rem', color: '#166534', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Most Protective Option</strong>
                      <span style={{ fontSize: '0.95rem', color: '#14532d', lineHeight: '1.5' }}>{issue.option_a_text}</span>
                    </div>
                  )}
                  {issue.option_a_text === "[DELETE ENTIRELY]" && (
                    <div style={{ background: 'rgba(225, 29, 72, 0.05)', border: '1px solid rgba(225, 29, 72, 0.2)', padding: '14px', borderRadius: '8px', textAlign: 'center' }}>
                      <strong style={{ fontSize: '1rem', color: 'var(--danger-color)' }}>❌ DELETE ENTIRELY (NOT APPLICABLE)</strong>
                    </div>
                  )}
                  {issue.option_b_text && (
                    <div style={{ background: 'rgba(100, 116, 139, 0.05)', border: '1px solid rgba(100, 116, 139, 0.2)', padding: '14px', borderRadius: '8px' }}>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Moderate Compromise</strong>
                      <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>{issue.option_b_text}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueSidebar;
