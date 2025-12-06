// API base URL
/** Base URL for the backend API */
export const API_BASE_URL = "http://localhost:5000/api";

// Mock restaurant data
/** Array of mock restaurant objects with menu, location, and offers */
export const RESTAURANTS = [
  {
    id: 1,
    name: "Pizza Palace",
    rating: 4.5,
    location: "Downtown",
    offers: "20% off on orders above $30",
    image: "🍕",
    reward_multiplier: 1.5,
    items: [
      { id: 1, name: "Margherita Pizza", price: 12.99, description: "Classic tomato and mozzarella" },
      { id: 2, name: "Pepperoni Pizza", price: 14.99, description: "Loaded with pepperoni" },
      { id: 3, name: "Veggie Supreme", price: 13.99, description: "Fresh vegetables and cheese" }
    ]
  },
  {
    id: 2,
    name: "Burger Barn",
    rating: 4.3,
    location: "Midtown",
    offers: "Free delivery on first order",
    reward_multiplier: 1.0,
    image: "🍔",
    items: [
      { id: 4, name: "Classic Burger", price: 9.99, description: "Beef patty with lettuce and tomato" },
      { id: 5, name: "Cheese Burger", price: 10.99, description: "Double cheese goodness" },
      { id: 6, name: "Veggie Burger", price: 8.99, description: "Plant-based patty" }
    ]
  },
  {
    id: 3,
    name: "Sushi Station",
    rating: 4.7,
    location: "Uptown",
    offers: "Buy 2 Get 1 Free on rolls",
    reward_multiplier: 1.5,
    image: "🍣",
    items: [
      { id: 7, name: "California Roll", price: 11.99, description: "Crab, avocado, cucumber" },
      { id: 8, name: "Spicy Tuna Roll", price: 13.99, description: "Fresh tuna with spicy mayo" },
      { id: 9, name: "Dragon Roll", price: 15.99, description: "Eel and avocado" }
    ]
  },
  {
    id: 4,
    name: "Taco Town",
    rating: 4.4,
    location: "West Side",
    offers: "Happy Hour: 3-6 PM",
    reward_multiplier: 1.0,
    image: "🌮",
    items: [
      { id: 10, name: "Beef Tacos", price: 8.99, description: "Three seasoned beef tacos" },
      { id: 11, name: "Chicken Tacos", price: 8.99, description: "Grilled chicken tacos" },
      { id: 12, name: "Fish Tacos", price: 9.99, description: "Crispy fish tacos" }
    ]
  }
];

// Mock groups data
/** Array of mock group objects with basic info: name, members, next order time */
export const GROUPS = [
  { id: 1, name: "Office Lunch Crew", members: 8, nextOrder: "Today 11:30 PM" },
  { id: 2, name: "Weekend Foodies", members: 12, nextOrder: "Saturday 7:00 PM" },
  { id: 3, name: "Study Group Eats", members: 5, nextOrder: "Tomorrow 6:00 PM" }
];

// Mock group details data
/** Object mapping group IDs to detailed information including members, menu, and delivery */
export const GROUP_DETAILS = {
  1: {
    id: 1,
    name: "Office Lunch Crew",
    restaurant: "Pizza Palace",
    restaurant_id : 1,
    organizer: "Alice",
    members: ["Alice", "Bob", "Charlie", "David", "Eva", "Frank", "Grace", "Hannah"],
    deliveryType: "Doorstep",
    nextOrderTime: new Date(new Date().setHours(12, 30, 0)), // Today 12:30 PM
    deliveryLocation: "Office Lobby",
    scheduledTime: "12:45 PM",
    maxMembers: 10,
    menu: [
      { id: 101, name: "Burger", price: 8 },
      { id: 102, name: "Salad", price: 6 }
    ]
  },
  2: {
    id: 2,
    name: "Weekend Foodies",
    restaurant: "Pasta Place",
    restaurant_id : 2,
    organizer: "Bob",
    members: ["Ivy", "Jack", "Kate", "Leo", "Mona", "Nate", "Olivia", "Paul", "Quinn", "Rita", "Sam", "Tina"],
    deliveryType: "Pickup Hub",
    nextOrderTime: new Date(new Date().setHours(19, 0, 0)), // Saturday 7 PM
    deliveryLocation: "Community Center",
    maxMembers: 15,
    menu: [
      { id: 201, name: "Pizza", price: 10 },
      { id: 202, name: "Pasta", price: 9 }
    ]
  },
  3: {
    id: 3,
    name: "Study Group Eats",
    restaurant: "Sushi Bar",
    restaurant_id : 3,
    organizer: "Uma",
    members: ["Uma", "Victor", "Wendy", "Xander", "Yara"],
    deliveryType: "Doorstep",
    nextOrderTime: new Date(new Date().setHours(18, 0, 0)), // Tomorrow 6 PM
    deliveryLocation: "Library Lobby",
    maxMembers: 8,
    menu: [
      { id: 301, name: "Sushi", price: 12 },
      { id: 302, name: "Ramen", price: 11 }
    ]
  }
};

// Mock nearby pools data
/** Array of nearby pool objects with current members, organizer, delivery location, and estimated savings */
export const NEARBY_POOLS = [
  {
    id: 1,
    restaurantName: "Pizza Palace",
    restaurantEmoji: "🍕",
    organizerName: "John D.",
    currentMembers: 3,
    maxMembers: 8,
    timeRemaining: "12 min",
    estimatedSavings: 4.50,
    deliveryLocation: "Building A, Floor 3",
    distance: "0.2 km"
  },
  {
    id: 2,
    restaurantName: "Pizza Palace",
    restaurantEmoji: "🍕",
    organizerName: "Sarah M.",
    currentMembers: 5,
    maxMembers: 10,
    timeRemaining: "8 min",
    estimatedSavings: 5.20,
    deliveryLocation: "Main Campus Center",
    distance: "0.4 km"
  },
  {
    id: 3,
    restaurantName: "Pizza Palace",
    restaurantEmoji: "🍕",
    organizerName: "Mike R.",
    currentMembers: 2,
    maxMembers: 6,
    timeRemaining: "15 min",
    estimatedSavings: 3.80,
    deliveryLocation: "Library Building",
    distance: "0.6 km"
  }
];

// Configuration constants
/** Object holding configurable app settings like delivery fee, pool times, and member limits */
export const CONFIG = {
  DELIVERY_FEE: 5.99,
  ESTIMATED_DELIVERY_TIME: "30-40 min",
  DEFAULT_POOL_TIME_LIMIT: 15,
  DEFAULT_MAX_MEMBERS: 8,
  MIN_POOL_TIME: 5,
  MAX_POOL_TIME: 30,
  MIN_POOL_MEMBERS: 2,
  MAX_POOL_MEMBERS: 15
};

// Page names
/** Object holding names of frontend pages for routing */
export const PAGES = {
  HOME: 'home',
  MY_GROUPS: 'mygroups',
  FIND_GROUPS: 'findgroups',
  EDIT_GROUP: 'editgroup',
  CREATE_POLL: 'createpoll'
};

// Order options
/** Enum for order type selections in UI */
export const ORDER_OPTIONS = {
  NOW: 'now',
  CREATE: 'create',
  JOIN: 'join'
};

// Group polls
/** Object mapping group IDs to arrays of poll objects */
export const GROUP_POLLS = {
  1: [
    {
      id: 1,
      createdBy: "Bob",
      createdOn: new Date('2024-06-10T10:00:00'),
      question: "What cuisine should we order next?",
      options: [
        { text: "Indian", votes: 2 },
        { text: "Chinese", votes: 1 },
        { text: "Mexican", votes: 0 }
      ],
      votedUsers: ["Bob"],
      createdBy: "Alice"
    }
  ],
  2: []
};
