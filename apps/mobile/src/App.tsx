import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// TODO: Importar screens
// import { LoginScreen }    from './screens/LoginScreen'
// import { HomeScreen }     from './screens/HomeScreen'
// import { CheckInScreen }  from './screens/CheckInScreen'
// import { RoomKeyScreen }  from './screens/RoomKeyScreen'
// import { ServicesScreen } from './screens/ServicesScreen'
// import { AttendanceScreen}from './screens/AttendanceScreen'

const Stack = createStackNavigator()
const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Stack.Navigator>
          {/* Screens registadas aqui */}
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  )
}
