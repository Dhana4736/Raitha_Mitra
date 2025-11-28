import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { auth, db } from './firebaseconfig';

// Import all required screens
import AddProductScreen from './screens/AddProductScreen';
import ChatListScreen from './screens/ChatListScreen';
import ChatScreen from './screens/ChatScreen';
import CustomerHomeScreen from './screens/CustomerHomeScreen';
import EditProductScreen from './screens/EditProductScreen';
import FarmerHomeScreen from './screens/FarmerHomeScreen';
import MyListingsScreen from './screens/MyListingsScreen';
import MyOrdersScreen from './screens/MyOrdersScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import ProfileScreen from './screens/ProfileScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import RoleSelectionScreen from './screens/RoleSelectionScreen';
import SignInScreen from './screens/SignInScreen';
import SignUpScreen from './screens/SignUpScreen';
import SplashScreen from './screens/SplashScreen';
import ViewOrdersScreen from './screens/ViewOrdersScreen';

// --- New Feature Screens ---
import WeatherScreen from './screens/WeatherScreen';
import CropRecommendationScreen from './screens/CropRecommendationScreen';
import CommunityBasketScreen from './screens/CommunityBasketScreen';
import PaymentHistoryScreen from './screens/PaymentHistoryScreen';
import SuccessStoriesScreen from './screens/SuccessStoriesScreen';
import LogisticsScreen from './screens/LogisticsScreen';
import AboutScreen from './screens/AboutScreen';
import UserFeedbacksScreen from './screens/UserFeedbacksScreen';

// --- NEWLY REGISTERED SCREENS (Required for Footer Navigation) ---
import TransactionHistoryScreen from './screens/TransactionHistoryScreen';
import DeliveryStatusScreen from './screens/DeliveryStatusScreen';
// import FarmerOrdersScreen from './screens/FarmerOrdersScreen'; // Removed: Using MyOrdersScreen instead

import { MaterialCommunityIcons, Octicons } from '@expo/vector-icons';

const Stack = createNativeStackNavigator();
const Tab = createMaterialTopTabNavigator();

// --- Farmer's Swipeable Tab Navigator ---
function FarmerTabs({ userData }) {
    return (
        <Tab.Navigator
            tabBarPosition="bottom"
            screenOptions={({ route }) => ({
                tabBarActiveTintColor: '#2E8B57',
                tabBarInactiveTintColor: 'gray',
                tabBarShowIcon: true,
                tabBarIcon: ({ color, focused }) => {
                    let iconName;
                    if (route.name === 'Home') iconName = 'home';
                    else if (route.name === 'Listings') iconName = 'list-unordered';
                    else if (route.name === 'Orders') return <MaterialCommunityIcons name={focused ? 'package-variant' : 'package-variant-closed'} size={26} color={color} />;
                    else if (route.name === 'Chats') return <MaterialCommunityIcons name={focused ? 'message-text' : 'message-text-outline'} size={26} color={color} />;
                    else if (route.name === 'My Profile') return <MaterialCommunityIcons name={focused ? 'account-circle' : 'account-circle-outline'} size={26} color={color} />;
                    return <Octicons name={iconName} size={24} color={color} />;
                },
                tabBarLabelStyle: { fontSize: 10 },
            })}
        >
            <Tab.Screen name="Home">{() => <FarmerHomeScreen userData={userData} />}</Tab.Screen>
            <Tab.Screen name="Listings" component={MyListingsScreen} />
            <Tab.Screen name="Orders" component={ViewOrdersScreen} />
            <Tab.Screen name="Chats" component={ChatListScreen} />
            <Tab.Screen name="My Profile">{() => <ProfileScreen route={{ params: { userData } }} />}</Tab.Screen>
        </Tab.Navigator>
    );
}

// --- Customer's Swipeable Tab Navigator ---
function CustomerTabs({ userData }) {
    return (
        <Tab.Navigator
            tabBarPosition="bottom"
             screenOptions={({ route }) => ({
                tabBarActiveTintColor: '#2E8B57',
                tabBarInactiveTintColor: 'gray',
                tabBarShowIcon: true,
                tabBarIcon: ({ color, focused }) => {
                    let iconName;
                    if (route.name === 'Market') iconName = focused ? 'storefront' : 'storefront-outline';
                    else if (route.name === 'My Orders') iconName = 'receipt-text-outline';
                    else if (route.name === 'Chats') iconName = focused ? 'message-text' : 'message-text-outline';
                    else if (route.name === 'My Profile') iconName = focused ? 'account-circle' : 'account-circle-outline';
                    return <MaterialCommunityIcons name={iconName} size={26} color={color} />;
                },
                tabBarLabelStyle: { fontSize: 10 },
            })}
        >
            <Tab.Screen name="Market">{() => <CustomerHomeScreen userData={userData} />}</Tab.Screen>
            <Tab.Screen name="My Orders" component={MyOrdersScreen} />
            <Tab.Screen name="Chats" component={ChatListScreen} />
            <Tab.Screen name="My Profile">{() => <ProfileScreen route={{ params: { userData } }} />}</Tab.Screen>
        </Tab.Navigator>
    );
}

// AuthStack
function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="SignIn" component={SignInScreen} />
        </Stack.Navigator>
    );
 }

// MainApp now correctly receives the `user` prop.
function MainApp({ user, userData }) {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Tabs" options={{ headerShown: false }}>
                {() => userData?.role === 'Farmer' 
                    ? <FarmerTabs userData={userData} /> 
                    : <CustomerTabs userData={userData} />
                }
            </Stack.Screen>
            
            {/* Core Screens */}
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: 'My Orders' }} />
            <Stack.Screen name="Orders" component={ViewOrdersScreen} options={{ title: 'Incoming Orders' }} />
            <Stack.Screen name="EditProduct" component={EditProductScreen} />
            <Stack.Screen name="EditProfile" component={ProfileSetupScreen} />

            {/* New Feature Screens */}
            <Stack.Screen name="Weather" component={WeatherScreen} options={{ title: 'Farm Weather' }} />
            <Stack.Screen name="CropRecommendation" component={CropRecommendationScreen} options={{ title: 'Smart Crop Advisor' }} />
            <Stack.Screen name="CommunityBasket" component={CommunityBasketScreen} options={{ title: 'Community Basket' }} />
            <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} options={{ title: 'My Earnings' }} />
            <Stack.Screen name="Logistics" component={LogisticsScreen} options={{ title: 'Transport & Logistics' }} />
            <Stack.Screen name="About" component={AboutScreen} options={{ title: 'About RaithaMitra' }} />
            <Stack.Screen name="UserFeedbacks" component={UserFeedbacksScreen} options={{ title: 'User Feedbacks' }} />

            {/* --- NEWLY REGISTERED SCREENS --- */}
            <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} options={{ title: 'Transaction History' }} />
            <Stack.Screen name="DeliveryStatus" component={DeliveryStatusScreen} options={{ title: 'Delivery Status' }} />
            
            {/* FIX: Map 'FarmerOrders' to 'MyOrdersScreen' since we are using the unified screen */}
            <Stack.Screen name="FarmerOrders" component={MyOrdersScreen} options={{ title: 'Manage Orders' }} />

            {/* AddProduct Screen with User Prop */}
            <Stack.Screen name="AddProduct">
              {(props) => <AddProductScreen {...props} user={user} />}
            </Stack.Screen>
        </Stack.Navigator>
    );
}

// Main App Component
export default function App() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (authenticatedUser) => {
            setUser(authenticatedUser);
            if (!authenticatedUser) {
                setUserData(null);
                setLoading(false);
            }
        });
        return unsubscribeAuth;
    }, []);

    useEffect(() => {
        if (user) {
            const docRef = doc(db, "users", user.uid);
            const unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                } else {
                    setUserData(null); 
                }
                setLoading(false);
            }, (error) => {
                console.error("Snapshot listener error:", error);
                setLoading(false);
            });
            return () => unsubscribeSnapshot();
        }
    }, [user]);

    if (loading) {
        return <SplashScreen />;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!user ? (
                    <Stack.Screen name="Auth" component={AuthStack} />
                ) : !userData?.photoURL ? (
                    <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
                ) : (
                    <Stack.Screen name="MainApp" children={() => <MainApp user={user} userData={userData} />} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}