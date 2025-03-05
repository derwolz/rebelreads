import React from 'react';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import BookPage from "@/pages/book-details";
import AllBooksPage from "@/pages/all-books";
import SettingsPage from "@/pages/settings-page";
import DashboardPage from "@/pages/dashboard-page";
import AuthorPage from "@/pages/author-page";
import NotFoundPage from "@/pages/not-found-page";


function App() {
  return (
    <Router>
      <div>
        <Switch>
          <Route path="/books/:id" component={BookPage} />
          <Route path="/books" component={AllBooksPage} />
          <Route path="/authors/:id" component={AuthorPage} />
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/settings/:location*" component={SettingsPage} />
          <Route component={NotFoundPage} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;