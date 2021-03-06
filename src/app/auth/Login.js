import React, { Component } from 'react';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import ErrorHandler from '../components/ErrorHandler';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8081/',
  timeout: 1000
});

class Login extends Component {
  constructor(props) {
    super(props);

    this.state = {
      username: "",
      email: "",
      password: ""
    };
  }

  componentDidMount() {
    var isLoggedIn = window.localStorage.getItem("isLoggedIn");
    if (isLoggedIn && isLoggedIn === 'true') {
      window.location.replace("/");
    }
  }

  handleChange = event => {
    this.setState({
      [event.target.id]: event.target.value
    });
  }

  handleSubmit = event => {
    event.preventDefault();

    var user = {
      username: this.state.username,
      password: this.state.password
    }

    axiosInstance.post('authenticate', user)
      .then((response) => {
        this.setState({
          error: false,
          errorMessage: ''
        });

        window.localStorage.setItem("isLoggedIn", true);
        window.localStorage.setItem("loginJwt", response.data.token);
        window.localStorage.setItem("username", jwtDecode(response.data.token).sub);

        window.location.replace("/");
      }, (error) => {
        window.localStorage.setItem("isLoggedIn", false);
        window.localStorage.setItem("loginJwt", "");

        let errMessage = ErrorHandler.sweetAlertApiErrorMessage(error);

        this.setState({
          error: true,
          errorMessage: errMessage
        });
      });
  }

  render() {

    return (

      <div className="bg-grey-lighter flex flex-col">
        <form onSubmit={this.handleSubmit}>
          <div className="container max-w-sm mx-auto flex-1 flex flex-col items-center justify-center px-2">
            <div className="bg-white px-6 py-8 rounded shadow-md text-black w-full font-mono">
              <h1 className="mb-8 text-3xl text-center">Login</h1>

              <input
                required
                type="text"
                className="block border border-grey-light w-full p-3 rounded mb-4"
                id="username"
                onChange={this.handleChange}
                placeholder="Username" />

              <input
                required
                type="password"
                className="block border border-grey-light w-full p-3 rounded mb-4"
                id="password"
                onChange={this.handleChange}
                placeholder="Password" />

              {this.state.error && <div>
                <p className="text-red-500">{this.state.errorMessage}</p>
              </div>}

              <div>
                <a className="no-underline border-b border-blue text-blue" href="../PasswordReset/">Forgot password ?</a>
              </div>

              <button
                type="submit"
                className="w-full text-center py-3 rounded bg-blue-800 text-white focus:outline-none my-1"
              >Login</button>

            </div>

            <div className="text-grey-dark mt-6">
              Don't have an account yet ?&nbsp;&nbsp;
                    <a className="no-underline border-b border-blue text-blue" href="../Signup/">
                Create one
                    </a>.
                </div>
          </div>
        </form>
      </div>
    );
  }
}

export default Login;
