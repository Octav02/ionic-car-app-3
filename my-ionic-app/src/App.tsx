import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';



import { CarsList } from './todo/CarsList';
import { CarProvider } from './todo/CarProvider';
import { CarEdit } from './todo/CarEdit';
import { CarAdd } from './todo/CarAdd';
import { AuthProvider, Login, PrivateRoute } from './auth';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <AuthProvider>
            <Route path="/login" component={Login} exact={true}/>
            <CarProvider>
              <PrivateRoute path="/cars" component={CarsList} exact={true} />
              <PrivateRoute path="/car" component={CarAdd} exact={true}/>
              <PrivateRoute path="/car/:id" component={CarEdit} exact={true}/>
            </CarProvider>
            <Route exact path="/" render={() => <Redirect to="/cars"/>}/>
          </AuthProvider>
        </IonRouterOutlet>
      </IonReactRouter>
  </IonApp>
);

export default App;
