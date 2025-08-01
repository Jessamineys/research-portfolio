// Market Data Dashboard JavaScript

class MarketDashboard {
    constructor() {
        this.data = {
            sp500: null,
            vix: null,
            fearGreed: null
        };
        this.charts = {};
        // API configuration - uses GitHub Actions generated config
        this.setupApiConfiguration();
        this.init();
    }

    setupApiConfiguration() {
        // Check if GitHub Actions generated configuration is available
        if (window.API_CONFIG && window.API_CONFIG.isConfigured()) {
            this.apiKeys = {
                alphaVantage: window.API_CONFIG.alphaVantage,
                fearGreed: 'demo' // Add other keys as needed
            };
            this.demoMode = false;
            this.rateLimits = window.API_CONFIG.rateLimits;
            
            console.log('✅ Using production API configuration');
            console.log('📊 Rate limits:', this.rateLimits);
        } else {
            // Fallback to demo mode
            this.apiKeys = {
                alphaVantage: 'demo',
                fearGreed: 'demo'
            };
            this.demoMode = true;
            this.rateLimits = { callsPerMinute: 0, callsPerDay: 0 };
            
            console.log('⚠️ Running in demo mode - API keys not configured');
            this.showDemoModeNotification();
        }
    }

    async init() {
        this.setupEventListeners();
        this.showLoading(true);
        await this.loadAllData();
        this.setupCharts();
        this.showLoading(false);
        this.updateLastRefreshTime();
        
        // Set up auto-refresh every 5 minutes
        setInterval(() => this.refreshData(), 5 * 60 * 1000);
    }

    setupEventListeners() {
        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.refreshData();
        });

        // Time period selector
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateChartPeriod(e.target.dataset.period);
            });
        });

        // Email subscription
        document.getElementById('emailForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEmailSubscription();
        });
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }

    async loadAllData() {
        try {
            await Promise.all([
                this.fetchSP500Data(),
                this.fetchVIXData(),
                this.fetchFearGreedData()
            ]);
            
            this.updateMetricCards();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load market data. Please try again.');
        }
    }

    async fetchSP500Data() {
        try {
            // Using Alpha Vantage API (free tier allows 5 calls/minute)
            const symbol = 'SPY';
            const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKeys.alphaVantage}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data['Global Quote']) {
                const quote = data['Global Quote'];
                this.data.sp500 = {
                    price: parseFloat(quote['05. price']),
                    change: parseFloat(quote['09. change']),
                    changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
                    volume: parseInt(quote['06. volume']),
                    lastUpdated: quote['07. latest trading day']
                };
            } else {
                // Fallback to mock data for demo
                this.data.sp500 = this.getMockSP500Data();
            }
        } catch (error) {
            console.error('Error fetching S&P 500 data:', error);
            this.data.sp500 = this.getMockSP500Data();
        }
    }

    async fetchVIXData() {
        try {
            // VIX data from Alpha Vantage
            const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=VIX&apikey=${this.apiKeys.alphaVantage}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data['Global Quote']) {
                const quote = data['Global Quote'];
                this.data.vix = {
                    price: parseFloat(quote['05. price']),
                    change: parseFloat(quote['09. change']),
                    changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
                    lastUpdated: quote['07. latest trading day']
                };
            } else {
                this.data.vix = this.getMockVIXData();
            }
        } catch (error) {
            console.error('Error fetching VIX data:', error);
            this.data.vix = this.getMockVIXData();
        }
    }

    async fetchFearGreedData() {
        try {
            // CNN Fear & Greed Index - using a public API or scraping service
            // Note: You may need to set up a backend service to fetch this data
            // due to CORS restrictions
            
            // For now, using mock data
            this.data.fearGreed = this.getMockFearGreedData();
        } catch (error) {
            console.error('Error fetching Fear & Greed data:', error);
            this.data.fearGreed = this.getMockFearGreedData();
        }
    }

    // Mock data methods for demo purposes
    getMockSP500Data() {
        const basePrice = 4200;
        const randomChange = (Math.random() - 0.5) * 100;
        return {
            price: basePrice + randomChange,
            change: randomChange,
            changePercent: (randomChange / basePrice) * 100,
            volume: Math.floor(Math.random() * 1000000000),
            lastUpdated: new Date().toISOString().split('T')[0]
        };
    }

    getMockVIXData() {
        const baseVix = 20;
        const randomChange = (Math.random() - 0.5) * 10;
        return {
            price: Math.max(10, baseVix + randomChange),
            change: randomChange,
            changePercent: (randomChange / baseVix) * 100,
            lastUpdated: new Date().toISOString().split('T')[0]
        };
    }

    getMockFearGreedData() {
        const value = Math.floor(Math.random() * 100);
        let status, sentiment;
        
        if (value <= 25) {
            status = 'Extreme Fear';
            sentiment = 'extreme-fear';
        } else if (value <= 45) {
            status = 'Fear';
            sentiment = 'fear';
        } else if (value <= 55) {
            status = 'Neutral';
            sentiment = 'neutral';
        } else if (value <= 75) {
            status = 'Greed';
            sentiment = 'greed';
        } else {
            status = 'Extreme Greed';
            sentiment = 'extreme-greed';
        }

        return {
            value: value,
            status: status,
            sentiment: sentiment,
            lastUpdated: new Date().toISOString().split('T')[0]
        };
    }

    updateMetricCards() {
        // Update S&P 500 card
        if (this.data.sp500) {
            document.getElementById('sp500Price').textContent = `$${this.data.sp500.price.toFixed(2)}`;
            const changeEl = document.getElementById('sp500Change');
            const changeText = `${this.data.sp500.change >= 0 ? '+' : ''}${this.data.sp500.change.toFixed(2)} (${this.data.sp500.changePercent.toFixed(2)}%)`;
            changeEl.textContent = changeText;
            changeEl.className = `change ${this.data.sp500.change >= 0 ? 'positive' : 'negative'}`;
            document.getElementById('sp500Updated').textContent = this.data.sp500.lastUpdated;
        }

        // Update VIX card
        if (this.data.vix) {
            document.getElementById('vixPrice').textContent = this.data.vix.price.toFixed(2);
            const changeEl = document.getElementById('vixChange');
            const changeText = `${this.data.vix.change >= 0 ? '+' : ''}${this.data.vix.change.toFixed(2)} (${this.data.vix.changePercent.toFixed(2)}%)`;
            changeEl.textContent = changeText;
            changeEl.className = `change ${this.data.vix.change >= 0 ? 'positive' : 'negative'}`;
            
            // VIX status indicator
            const statusEl = document.getElementById('vixStatus');
            let statusClass, statusText;
            if (this.data.vix.price < 20) {
                statusClass = 'low';
                statusText = 'Low Volatility';
            } else if (this.data.vix.price < 30) {
                statusClass = 'medium';
                statusText = 'Medium Volatility';
            } else {
                statusClass = 'high';
                statusText = 'High Volatility';
            }
            statusEl.className = `status-badge ${statusClass}`;
            statusEl.textContent = statusText;
        }

        // Update Fear & Greed card
        if (this.data.fearGreed) {
            document.getElementById('fearGreedValue').textContent = this.data.fearGreed.value;
            const sentimentEl = document.getElementById('fearGreedStatus');
            sentimentEl.textContent = this.data.fearGreed.status;
            sentimentEl.className = `sentiment ${this.data.fearGreed.sentiment}`;
            
            // Update gauge
            const gaugeEl = document.getElementById('fearGreedGauge');
            gaugeEl.style.width = `${this.data.fearGreed.value}%`;
            
            // Set gauge color based on sentiment
            let gaugeColor;
            switch (this.data.fearGreed.sentiment) {
                case 'extreme-fear':
                    gaugeColor = '#dc2626';
                    break;
                case 'fear':
                    gaugeColor = '#f59e0b';
                    break;
                case 'neutral':
                    gaugeColor = '#6b7280';
                    break;
                case 'greed':
                    gaugeColor = '#10b981';
                    break;
                case 'extreme-greed':
                    gaugeColor = '#059669';
                    break;
                default:
                    gaugeColor = '#6b7280';
            }
            gaugeEl.style.backgroundColor = gaugeColor;
        }
    }

    setupCharts() {
        this.setupSP500Chart();
        this.setupVIXChart();
    }

    setupSP500Chart() {
        const ctx = document.getElementById('sp500Chart').getContext('2d');
        
        // Generate mock historical data
        const data = this.generateMockHistoricalData('sp500', 30);
        
        this.charts.sp500 = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'S&P 500',
                    data: data.values,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        display: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 0,
                        hoverRadius: 5
                    }
                }
            }
        });
    }

    setupVIXChart() {
        const ctx = document.getElementById('vixChart').getContext('2d');
        
        // Generate mock VIX data
        const data = this.generateMockHistoricalData('vix', 30);
        
        this.charts.vix = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'VIX',
                    data: data.values,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    annotation: {
                        annotations: {
                            line1: {
                                type: 'line',
                                yMin: 20,
                                yMax: 20,
                                borderColor: 'rgba(255, 99, 132, 0.5)',
                                borderWidth: 2,
                                borderDash: [5, 5],
                                label: {
                                    content: 'Fear Threshold',
                                    enabled: true,
                                    position: 'end'
                                }
                            },
                            line2: {
                                type: 'line',
                                yMin: 30,
                                yMax: 30,
                                borderColor: 'rgba(255, 99, 132, 0.8)',
                                borderWidth: 2,
                                borderDash: [5, 5],
                                label: {
                                    content: 'High Volatility',
                                    enabled: true,
                                    position: 'end'
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        display: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        min: 10,
                        max: 50
                    }
                },
                elements: {
                    point: {
                        radius: 0,
                        hoverRadius: 5
                    }
                }
            }
        });
    }

    generateMockHistoricalData(type, days) {
        const labels = [];
        const values = [];
        const now = new Date();
        
        let baseValue = type === 'sp500' ? 4200 : 20;
        let currentValue = baseValue;
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            // Add some randomness to simulate market movement
            const volatility = type === 'sp500' ? 50 : 5;
            const change = (Math.random() - 0.5) * volatility;
            currentValue += change;
            
            // Ensure values stay within reasonable bounds
            if (type === 'sp500') {
                currentValue = Math.max(3800, Math.min(4600, currentValue));
            } else {
                currentValue = Math.max(10, Math.min(50, currentValue));
            }
            
            values.push(Number(currentValue.toFixed(2)));
        }
        
        return { labels, values };
    }

    updateChartPeriod(period) {
        let days;
        switch (period) {
            case '1D':
                days = 1;
                break;
            case '5D':
                days = 5;
                break;
            case '1M':
                days = 30;
                break;
            case '3M':
                days = 90;
                break;
            case '1Y':
                days = 365;
                break;
            default:
                days = 30;
        }
        
        // Update charts with new data
        const sp500Data = this.generateMockHistoricalData('sp500', days);
        const vixData = this.generateMockHistoricalData('vix', days);
        
        this.charts.sp500.data.labels = sp500Data.labels;
        this.charts.sp500.data.datasets[0].data = sp500Data.values;
        this.charts.sp500.update();
        
        this.charts.vix.data.labels = vixData.labels;
        this.charts.vix.data.datasets[0].data = vixData.values;
        this.charts.vix.update();
    }

    async refreshData() {
        this.showLoading(true);
        await this.loadAllData();
        this.updateLastRefreshTime();
        this.showLoading(false);
    }

    updateLastRefreshTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZoneName: 'short'
        });
        document.getElementById('lastUpdated').textContent = `Last updated: ${timeString}`;
    }

    handleEmailSubscription() {
        const email = document.getElementById('emailInput').value;
        
        if (!this.isValidEmail(email)) {
            alert('Please enter a valid email address');
            return;
        }
        
        // Here you would typically send the email to your backend service
        this.subscribeToDigest(email);
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async subscribeToDigest(email) {
        try {
            // Simulate API call to subscribe user
            // In a real implementation, you would send this to your backend
            
            const subscriptionData = {
                email: email,
                preferences: {
                    dailyDigest: true,
                    alerts: true
                },
                subscribedAt: new Date().toISOString()
            };
            
            // Store in localStorage for demo purposes
            localStorage.setItem('marketDigestSubscription', JSON.stringify(subscriptionData));
            
            alert('Successfully subscribed to daily market digest!');
            document.getElementById('emailInput').value = '';
            
            // Schedule daily email (in real implementation, this would be handled by backend)
            this.scheduleDailyDigest(email);
            
        } catch (error) {
            console.error('Subscription error:', error);
            alert('Failed to subscribe. Please try again.');
        }
    }

    scheduleDailyDigest(email) {
        // This would typically be handled by a backend service
        // For demo purposes, we'll just log what the digest would contain
        console.log('Daily digest scheduled for:', email);
        console.log('Digest content preview:', this.generateDigestContent());
    }

    generateDigestContent() {
        const digestData = {
            date: new Date().toDateString(),
            markets: {
                sp500: this.data.sp500,
                vix: this.data.vix,
                fearGreed: this.data.fearGreed
            },
            summary: this.generateTextSummary()
        };
        
        return digestData;
    }

    generateTextSummary() {
        let summary = "Market Summary for " + new Date().toDateString() + ":\n\n";
        
        if (this.data.sp500) {
            const direction = this.data.sp500.change >= 0 ? "gained" : "lost";
            summary += `The S&P 500 ${direction} ${Math.abs(this.data.sp500.changePercent).toFixed(2)}% `;
            summary += `closing at ${this.data.sp500.price.toFixed(2)}.\n`;
        }
        
        if (this.data.vix) {
            summary += `Volatility (VIX) closed at ${this.data.vix.price.toFixed(2)}, `;
            summary += `indicating ${this.data.vix.price < 20 ? 'low' : this.data.vix.price < 30 ? 'moderate' : 'high'} market volatility.\n`;
        }
        
        if (this.data.fearGreed) {
            summary += `Investor sentiment shows ${this.data.fearGreed.status.toLowerCase()} `;
            summary += `with a Fear & Greed Index reading of ${this.data.fearGreed.value}.\n`;
        }
        
        return summary;
    }

    showDemoModeNotification() {
        // Create demo mode notification
        const demoDiv = document.createElement('div');
        demoDiv.className = 'demo-notification';
        demoDiv.innerHTML = `
            <div class="demo-content">
                <span>📊 Demo Mode: Using simulated market data</span>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add demo styles
        demoDiv.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #fef3c7;
            color: #d97706;
            padding: 1rem;
            border-radius: 0.5rem;
            border: 1px solid #fbbf24;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            max-width: 400px;
        `;
        
        document.body.appendChild(demoDiv);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (demoDiv.parentElement) {
                demoDiv.remove();
            }
        }, 10000);
    }

    showError(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `
            <div class="error-content">
                <span>⚠️ ${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add error styles
        errorDiv.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #fee2e2;
            color: #dc2626;
            padding: 1rem;
            border-radius: 0.5rem;
            border: 1px solid #fecaca;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            max-width: 400px;
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.marketDashboard = new MarketDashboard();
});

// Export for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarketDashboard;
}