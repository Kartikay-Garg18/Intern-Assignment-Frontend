import React, { useState, useEffect, useRef } from 'react';
import { LineChart, BarChart, PieChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, Bar, Pie, Cell } from 'recharts';
import { ArrowUp, BarChart2, PieChart as PieChartIcon, LineChart as LineChartIcon, Table as TableIcon, Download, RefreshCw } from 'lucide-react';

const App = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [connected, setConnected] = useState(true);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage = { type: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError(null);
    
    try {
      // Make API call to backend
      const response = await fetch('https://intern-assignment-backend-iota.vercel.app/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input, history: messages })
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      
      // Add AI response
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: data.text,
        visualizations: data.visualizations || [],
        sqlQuery: data.sqlQuery,
        tableData: data.tableData || null
      }]);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      setMessages(prev => [...prev, {
        type: 'error',
        content: `Failed to get a response. ${err.message}`
      }]);
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  // Example suggestion questions
  const exampleQuestions = [
    "What were our top-performing products last quarter by revenue?",
    "Show me the trend of customer acquisition costs by channel over the past year",
    "Which sales regions had the highest growth rate compared to the same period last year?",
    "Analyze customer churn rates by demographic segment",
    "What's the correlation between marketing spend and revenue across different product categories?"
  ];

  // Function to render visualizations based on type
  const renderVisualization = (viz) => {
    switch(viz.type) {
      case 'bar':
        return (
          <div className="p-4 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-medium mb-2">{viz.title}</h3>
            <div className="h-64">
              <BarChart width={600} height={240} data={viz.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={viz.xAxis} />
                <YAxis />
                <Tooltip />
                <Legend />
                {viz.series.map((s, i) => (
                  <Bar key={i} dataKey={s.dataKey} fill={s.color || `#${Math.floor(Math.random()*16777215).toString(16)}`} />
                ))}
              </BarChart>
            </div>
          </div>
        );
      case 'line':
        return (
          <div className="p-4 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-medium mb-2">{viz.title}</h3>
            <div className="h-64">
              <LineChart width={600} height={240} data={viz.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={viz.xAxis} />
                <YAxis />
                <Tooltip />
                <Legend />
                {viz.series.map((s, i) => (
                  <Line key={i} type="monotone" dataKey={s.dataKey} stroke={s.color || `#${Math.floor(Math.random()*16777215).toString(16)}`} />
                ))}
              </LineChart>
            </div>
          </div>
        );
      case 'pie':
        return (
          <div className="p-4 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-medium mb-2">{viz.title}</h3>
            <div className="h-64">
              <PieChart width={400} height={240}>
                <Pie
                  data={viz.data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey={viz.valueKey}
                  nameKey={viz.nameKey}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {viz.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={viz.colors?.[index] || `#${Math.floor(Math.random()*16777215).toString(16)}`} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </div>
          </div>
        );
      case 'table':
        if (!viz.data || viz.data.length === 0) return null;
        const columns = Object.keys(viz.data[0]);
        
        return (
          <div className="p-4 bg-white rounded-lg shadow-md overflow-x-auto">
            <h3 className="text-lg font-medium mb-2">{viz.title}</h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((col, i) => (
                    <th 
                      key={i}
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {viz.data.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columns.map((col, colIndex) => (
                      <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return null;
    }
  };

  // Render table for raw query results
  const renderDataTable = (tableData) => {
    if (!tableData || !tableData.columns || !tableData.rows || tableData.rows.length === 0) {
      return null;
    }

    return (
      <div className="mt-4 p-4 bg-white rounded-lg shadow-md overflow-x-auto">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Query Results</h3>
          <button 
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
            onClick={() => {
              // Convert data to CSV and download
              const headers = tableData.columns.join(',');
              const rows = tableData.rows.map(row => 
                tableData.columns.map(col => `"${row[col]}"`).join(',')
              ).join('\n');
              const csv = `${headers}\n${rows}`;
              
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.setAttribute('hidden', '');
              a.setAttribute('href', url);
              a.setAttribute('download', 'query_results.csv');
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {tableData.columns.map((col, i) => (
                <th 
                  key={i}
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableData.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {tableData.columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-gray-200 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-blue-800 flex items-center gap-2">
            <BarChart2 className="text-blue-600" size={28} />
            AI Data Agent
          </h1>
          <div className="flex items-center space-x-2">
            <span className={`inline-block h-3 w-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} border border-white shadow`} />
            <span className="text-sm text-gray-600">{connected ? 'Connected' : 'Disconnected'}</span>
            <button 
              className="ml-2 p-1 rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              onClick={() => setConnected(prev => !prev)}
              aria-label="Toggle connection"
            >
              <RefreshCw size={18} className="text-gray-600" />
            </button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome section - show only when no messages */}
        {messages.length === 0 && (
          <div className="text-center py-16">
            <h2 className="text-4xl font-extrabold text-blue-900 mb-4">Welcome to <span className="text-blue-700">AI Data Agent</span></h2>
            <p className="text-lg text-gray-600 mb-8">Ask complex business questions about your data and get instant insights.</p>
            
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Try asking:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {exampleQuestions.map((question, index) => (
                  <button
                    key={index}
                    className="p-5 bg-white rounded-xl shadow hover:shadow-lg border border-gray-200 text-left transition group focus:outline-none focus:ring-2 focus:ring-blue-400"
                    onClick={() => setInput(question)}
                  >
                    <span className="text-gray-800 group-hover:text-blue-700 transition">{question}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-6">
          {messages.map((message, index) => (
            <div key={index} className={`mb-6 flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-2xl p-5 max-w-3xl border transition-all ${
                message.type === 'user' 
                  ? 'bg-blue-600 text-white border-blue-200 shadow-lg'
                  : message.type === 'error'
                  ? 'bg-red-100 text-red-900 border-red-200 shadow'
                  : 'bg-white border-gray-100 shadow-md'
              }`}
              style={{ width: message.type !== 'user' ? '100%' : 'auto' }}>
                {/* Message content */}
                <div className="text-base leading-relaxed whitespace-pre-line">
                  {message.content}
                </div>
                
                {/* SQL Query (if present) */}
                {message.sqlQuery && (
                  <div className="mt-4 bg-gray-50 border border-gray-200 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1 font-semibold">Generated SQL:</p>
                    <pre className="text-xs overflow-x-auto text-gray-700">{message.sqlQuery}</pre>
                  </div>
                )}
                
                {/* Visualizations (if present) */}
                {message.visualizations && message.visualizations.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {message.visualizations.map((viz, vizIndex) => (
                      <div key={vizIndex}>
                        {renderVisualization(viz)}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Data Table (if present) */}
                {message.tableData && renderDataTable(message.tableData)}
              </div>
            </div>
          ))}
          
          {/* Loading placeholder */}
          {loading && (
            <div className="mb-6 flex justify-start">
              <div className="rounded-2xl p-5 max-w-3xl border bg-white border-gray-100 shadow-md w-full animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="mt-4 h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow">
            {error}
          </div>
        )}
        
        {/* Input form */}
        <div className="sticky bottom-0 bg-gradient-to-t from-gray-100 via-white to-transparent pt-4 z-10">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="flex-1 bg-white rounded-xl shadow-md p-2 border border-gray-200">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a business question..."
                className="w-full resize-none border-0 focus:ring-0 text-base p-2 max-h-32 bg-transparent placeholder-gray-400 focus:outline-none"
                rows={Math.min(4, input.split('\n').length || 1)}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className={`p-4 rounded-full shadow transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
              disabled={loading}
              aria-label="Send"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <ArrowUp size={20} />
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default App;