import React from 'react';
import Home from './Home';
import Signup from './auth/Signup';
import Login from './auth/Login';
import Profile from './auth/Profile';
import Settings from './auth/Settings';
import PasswordReset from './auth/PasswordReset';
import PrivateRoute from './PrivateRoute';
import Browse from './browse/Browse';
import FictionDetail from './fiction/FictionDetail';
import ChapterReader from './fiction/ChapterReader';
import UserProfile from './user/UserProfile';
import AuthorDashboard from './author/AuthorDashboard';
import CreateFiction from './author/CreateFiction';
import EditFiction from './author/EditFiction';
import WriteChapter from './author/WriteChapter';
import EditChapter from './author/EditChapter';
import { Switch, BrowserRouter as Router, Route } from 'react-router-dom';

function Main() {
    return (
        <Router>
            <Switch>
                <PrivateRoute exact path='/' component={Home} />
                <Route path='/browse' component={Browse} />
                <Route exact path='/fiction/:id' component={FictionDetail} />
                <Route exact path='/fiction/:id/chapter/:num' component={ChapterReader} />
                <Route path='/profile/:username' component={UserProfile} />
                <PrivateRoute exact path='/author/dashboard' component={AuthorDashboard} />
                <PrivateRoute exact path='/author/fiction/new' component={CreateFiction} />
                <PrivateRoute exact path='/author/fiction/:id/edit' component={EditFiction} />
                <PrivateRoute exact path='/author/fiction/:id/chapter/new' component={WriteChapter} />
                <PrivateRoute exact path='/author/fiction/:id/chapter/:num/edit' component={EditChapter} />
                <Route path='/Signup' component={Signup} />
                <Route path='/login' component={Login} />
                <Route path='/PasswordReset' component={PasswordReset} />
                <PrivateRoute exact path='/Profile' component={Profile} />
                <PrivateRoute exact path='/Settings' component={Settings} />
            </Switch>
        </Router>
    );
}

export default Main;
