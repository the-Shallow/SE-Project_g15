# SE-Project_g15
The repository contains submissions for Software Engineering project done by Group-6 as a part of Project 3

# 🍕 FoodPool: Eat Together. Save Together.

[![codecov](https://codecov.io/gh/the-Shallow/SE-Project_g15/branch/main/graph/badge.svg?token=R1FHWXT0ML)](https://codecov.io/gh/the-Shallow/SE-Project_g15)
![Flake8](https://img.shields.io/badge/style-flake8-blue)
![ESLint](https://img.shields.io/badge/lint-eslint-purple)
![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)
![Code style: prettier](https://img.shields.io/badge/code%20style-prettier-ff69b4.svg)
![Pylint](https://img.shields.io/badge/lint-pylint-yellowgreen)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.17547440.svg)](https://doi.org/10.5281/zenodo.17547440)
[![Python](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/flask-3.0.3-green.svg)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/react-18.0-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-14%2B-blue.svg)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Community-driven pooled food ordering platform that saves costs, reduces delivery inefficiency, and promotes eco-friendly practices.

---

 📹 Demo Video
🎥 [Group 6 - Project 3 - Watch our demo here](https://youtu.be/Y8eIS8SAdfw)

---

 🌟 Overview

FoodPool enables community-driven pooled food orders, letting nearby users combine meals to save costs and streamline delivery.

# Key Benefits:
- 💰 Save Money - Split delivery fees and access bulk discounts
- 🌍 Eco-Friendly - Reduce CO₂ emissions through optimized deliveries
- 🤝 Community-Driven - Connect with neighbors
- 🎁 Dual Rewards - Earn app loyalty points + restaurant incentives

---

 ✨ Features
- 🎯 Organizer-Led Orders - Single/multi-origin, curated menus, poll-based finalization
- 📍 Location-Based Pools - Discover and join nearby pools
- 💬 Real-Time Collaboration - Live chat, notifications, countdowns
- 🔄 Recurring Pools - Schedule weekly/monthly deliveries
- 📊 Dynamic Pricing - See savings in real-time as members join
- 🌱 Eco-Impact Tracking - Track CO₂ saved per pooled delivery
- 🧠 Delivery Intelligence - Machine learning clustering and predictive ETA with traffic adjustments
- 🏠 Proximity Pool Discovery - Find nearby food pools using location-based radius search
- 💎 Advanced Loyalty Engine - Tier progression, streak bonuses, and redeemable coupons
- 📊 Analytics Dashboard - Track pooled orders, achievements, and leaderboard rankings
  
---

### 📚 Case Studies

**1. Student Dorm Meal Pooling**  
- 🏫 **Scenario:** Students living in the same dorm wanted to save on individual meal delivery fees.  
- 🍔 **Solution:** They created a shared pool on FoodPool to combine lunch orders.  
- 🎯 **Outcome:** Members enjoyed lower delivery costs, real-time order updates, and a simplified payment process. Social interaction among dorm residents increased.  

**2. Office Lunch Pooling**  
- 🏢 **Scenario:** A 12-person office frequently ordered lunch separately, causing higher delivery charges and coordination issues.  
- 🍽️ **Solution:** The team consolidated their orders using FoodPool for the entire week.  
- 🎯 **Outcome:** Delivery fees were reduced by $2–$5 per meal, orders arrived more efficiently, and employees saved time. The built-in chat facilitated quick coordination.  

**3. Festival Event Catering**  
- 🎉 **Scenario:** A community festival needed meals for 50 attendees from multiple vendors.  
- 🍱 **Solution:** Event organizers used FoodPool to manage bulk orders and track participants.  
- 🎯 **Outcome:** Total food costs were reduced by 20%, delivery logistics were simplified, and attendees enjoyed a seamless, community-driven ordering experience.  

**4. Co-Living Space Meal Coordination**  
- 🏠 **Scenario:** Residents in a co-living apartment wanted to coordinate weekly grocery and meal deliveries.  
- 🛒 **Solution:** Recurring pools were created on FoodPool to manage shared orders efficiently.  
- 🎯 **Outcome:** Residents saved $10–$15 per week, avoided duplicate orders, maintained transparency in expenses, and improved communication within the group.  

---

 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Flask 3.0.3 (Python) |
| Frontend | React 18 |
| Database | PostgreSQL 14+ |
| Authentication | JWT (Flask-JWT-Extended) |
| ORM | SQLAlchemy 2.0.44 |
| Testing | pytest, Jest |
| CI/CD | GitHub Actions |

---

 🚀 Getting Started

# Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

# Backend Setup
```bash
# Clone and navigate to backend
git clone https://github.com/srushti3333/SE-Project_g15.git
cd SE-Project_g15/Proj2/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
echo "DATABASE_URL=postgresql://user:password@localhost:5432/foodpool" > .env
echo "JWT_SECRET_KEY=your-secret-key" >> .env

# Run server
python app.py
```

Server runs on `http://localhost:5000`

# Frontend Setup
```bash
# Navigate to frontend
cd ../frontend

# Install dependencies
npm install

# Set up environment
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

# Start development server
npm start
```

App runs on `http://localhost:3000`

---

 🧪 Running Tests

# Backend
```bash
cd Proj2/backend
python -m pytest --cov=. --cov-report=html -v
# View coverage: open htmlcov/index.html
```

# Frontend
```bash
cd Proj2/frontend
npm run coverage
# View coverage: open coverage/lcov-report/index.html
```

Test Coverage: 100+ test cases covering nominal and off-nominal scenarios

---

🛠️ Troubleshooting

If you encounter issues while setting up or running FoodPool, try the following steps:

1. **Backend server not starting**  
   - Ensure your virtual environment is activated (`source venv/bin/activate` or `venv\Scripts\activate` on Windows).  
   - Verify that PostgreSQL is running and `DATABASE_URL` in `.env` is correct.  
   - Check for missing dependencies and run `pip install -r requirements.txt`.

2. **Frontend issues or blank screen**  
   - Ensure `npm install` has completed successfully.  
   - Verify that `.env` contains `REACT_APP_API_URL` pointing to the backend server (`http://localhost:5000/api`).  
   - Restart the development server using `npm start`.

3. **Database connection errors**  
   - Confirm that PostgreSQL credentials (user, password, database name) match the `.env` file.  
   - Ensure that the database exists and the user has proper privileges.

4. **General errors**  
   - Check the console logs (browser for frontend, terminal for backend) for error messages.  
   - Search for the error in GitHub Issues or post a new issue if it has not been reported.  
   - Consult the discussion forum for tips from other users.

---

 📁 Project Structure
```
SE-Project_g15/
├── Proj3/
│   ├── backend/
│   │   ├── app.py              # Flask entry point
│   │   ├── models/             # Database models
│   │   ├── controllers/        # Relevant controllers
│   │   ├── routes/             # API endpoints
│   │   ├── requirements.txt    # Dependencies
│   │   ├── .env               # Environment variables
│   │   └── tests/              # Backend tests
│   │
│   └── frontend/
│       ├── src/
│       │   ├── App.jsx
│       │   ├── pages/          # Frontend tests present with each related file 
│       │   ├── components/     # Common Components & Frontend tests present with each related file 
│       │   └── context/        # App context
│       │   └── routes/         # App route setup
│       │   └── utils/          # Common utility constants
│       │   └── hooks/          # Common hooks to use
│       │   ├── setupTests.js
│       └──  package.json        
└── .github/
    └── workflows/
        └── ci.yml          # CI/CD pipeline
```

---

 📊 Development Workflow

# Branching Strategy
- `main` - Production code
- `develop` - Integration branch
- `feature/*` - New features
- `hotfix/*` - Bug fixes

# Making Changes
```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "Add: feature description"

# Push and create PR
git push origin feature/your-feature
```

---

 👥 Team - Group 6

| Name |
|------|
| MIA GLENN | 
| RICHA JHA | 
| ISHWARYA GANDAMSETTY | 
| KHUSH PATEL | 

---
 📞 Discussion Forum

[![Discussion Forum](https://img.shields.io/badge/Discussion-Join%20Us-blue?style=for-the-badge)](https://discord.gg/Z6HcHbfUsu)

---

 📊 Project Milestones
 
##### ✅  Release 2 (November 2025) #####

📍 **Al-Powered Delivery Optimization** - Predictive routing, demand clustering (DBSCAN ML), and adaptive ETA generation with rush-hour adjustments.

🌐 **Proximity-Based Pool Discovery** - Location-based search with configurable radius, distance calculations, and visibility filters to find nearby active pools.

💎 **Enhanced Reward System** - Multi-tier loyalty (Bronze/Silver/Gold), streak tracking, coupon redemption, and point-based discounts.

📊 **Analytics & Impact Insights** - Personal analytics, tracking sustainable impact through achievements, and leaderboarddriven engagement..


##### ✅ Release 1 (October 2025) #####

 🧠 **Core Platform Architecture** - Stable backend and modular API ecosystem enabling real-time data sync, scalability, and secure operations across all modules.
 
🍴 **Restaurant Intelligence Layer** - Context-aware restaurant discovery with structured menu mapping, item metadata, and dynamic content rendering.

🛒 **Collaborative Ordering Engine** - Unified order flow supporting individual, pooled, and group-based checkouts with transaction consistency and shared tracking.

⚡ **Real-Time Interaction Framework** - Low-latency polling, instant decision updates, and countdown-based coordination driving group synchronization and engagement.


---

💰 Funding

This project is developed as part of the **Software Engineering course at North Carolina State University** by Group 15.  
Currently, the project is self-funded by the team and does not receive external funding.

---

 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

 🤝 Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

All pull requests require:
- Passing CI/CD checks
- Code review approval
- Test coverage for new features

---


### 📖 How to Cite

If you use **FoodPool** in your research, projects, or presentations, please cite it using the metadata provided in our [CITATION.cff](CITATION.cff) file.  

This file can be used with citation tools to automatically generate BibTeX, RIS, or other formats.

---

 🙏 Acknowledgments

Built with ❤️ by Group 6 for Software Engineering Course

Special thanks to our instructors and all contributors!

---

⭐ Star this repo if you find it useful!
