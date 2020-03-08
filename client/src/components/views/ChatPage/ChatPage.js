import React, { Component } from 'react';
import { Form, Icon, Input, Button, Row, Col, } from 'antd';
import io from 'socket.io-client';
import {connect} from 'react-redux';
import moment from 'moment';
import Dropzone from 'react-dropzone'
import {getChats, afterPostMessage} from '../../../_actions/chat_actions';
import ChatCard from './sections/ChatCard';
import Axios from 'axios';

class ChatPage extends Component {
 
state= {
    chatMessage: "",
}

componentDidMount() {
    let server = 'http://localhost:5000';
    this.socket = io(server);

    this.props.dispatch(getChats());

    this.socket.on('Output Chat Message', messageFromBackEnd => {
        console.log(messageFromBackEnd);
        this.props.dispatch(afterPostMessage(messageFromBackEnd));
    })
}

hanleSearchChange = (e) => {
    // e.preventDefault()
    this.setState({chatMessage:e.target.value})
}


submitChatMessage = (e) => {
    e.preventDefault();
    let chatMessage = this.state.chatMessage;
    let userId = this.props.user.userData._id;
    let userName = this.props.user.userData.name;
    let userImage = this.props.user.userData.image;
    let nowTime = moment();
    let type = "Text";

    this.socket.emit('Input Chat Message', {
        chatMessage,
        userId,
        userName,
        userImage,
        nowTime,
        type
    });

    this.setState({chatMessage:""});
}


renderCards = () => 
    this.props.chats.chats
    && this.props.chats.chats.map((chat) => (
        <ChatCard key={chat._id}  {...chat} />
    ))
    
componentDidUpdate() {
    this.messagesEnd.scrollIntoView({behavior:'smooth'});
}


onDrop = (files) => {

    let formData = new FormData();
    const config = {
        header:{
            'content-type':'multipart/form-data'
        }
    };

    formData.append("file", files[0]);
    Axios.post('/api/chat/uploadfiles', formData, config)
         .then((res) => {
             console.log(res.data.url);
             if(res.data.success){
                let chatMessage = res.data.url;
                let userId = this.props.user.userData._id;
                let userName = this.props.user.userData.name;
                let userImage = this.props.user.userData.image;
                let nowTime = moment();
                let type = "VideoOrImage";

                this.socket.emit('Input Chat Message', {
                    chatMessage,
                    userId,
                    userName,
                    userImage,
                    nowTime,
                    type
                });
             }
         })
         .catch(err => {
             console.log(err);
         })
}
    render() {
        return (
            <div>
                 <React.Fragment>
                <div>
                    <p style={{ fontSize: '2rem', textAlign: 'center' }}> Real Time Chat</p>
                </div>

                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div className="infinite-container" style={{height: '500px', overflowY:"scroll"}}>
                        {this.props.chats && (
                            <div>{this.renderCards()}</div>
                        )}
                        {/* WHAT DOES THIS REF DO ? LOOK FOR IT AND GET MORE UPDATES ON IT ### */}
                        <div
                            ref={el => {
                                this.messagesEnd = el;
                            }}
                            style={{ float: "left", clear: "both" }}
                        />
                    </div>

                    <Row >
                        <Form layout="inline" onSubmit={this.submitChatMessage}>
                            <Col span={18}>
                                <Input
                                    id="message"
                                    prefix={<Icon type="message" style={{ color: 'rgba(0,0,0,.25)' }} />}
                                    placeholder="Let's start talking"
                                    type="text"
                                    value={this.state.chatMessage}
                                    onChange={this.hanleSearchChange}
                                />
                            </Col>
                            <Col span={2}>

                            <Dropzone onDrop={this.onDrop}>
                                {({getRootProps, getInputProps}) => (
                                    <section>
                                    <div {...getRootProps()}>
                                        <input {...getInputProps()} />
                                        <Button>
                                            <Icon type="upload"/>
                                        </Button>
                                    </div>
                                    </section>
                                )}
                            </Dropzone>

                            </Col>

                            <Col span={4}>
                                <Button type="primary" style={{ width: '100%' }} onClick={this.submitChatMessage}  htmlType="submit">
                                    <Icon type="enter" />
                                </Button>
                            </Col>
                        </Form>
                    </Row>
                </div>
            </React.Fragment>
            </div>
        )
    }
}

const mapStateToProps = (state) => {
    console.log(state.chat)
    return {
        user : state.user,
        chats:state.chat
    }
}

export default connect(mapStateToProps)(ChatPage)