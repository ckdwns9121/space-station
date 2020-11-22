/*global kakao*/
import React, { useEffect, useReducer, useRef, useState,useCallback } from 'react';

import {useSelector , useDispatch} from 'react-redux';
import {useHistory} from 'react-router-dom';

import {Paths} from '../../paths';

//styles
import styles from './MapContainer.module.scss';
import cn from 'classnames/bind';
import { ButtonBase, IconButton } from '@material-ui/core';
import search_icon from '../../static/asset/svg/main/search.svg'
import zoom_in from '../../static/asset/svg/main/plus.svg'
import zoom_out from '../../static/asset/svg/main/minus.svg'
import filter_img from '../../static/asset/svg/main/filter.svg';
import time_img from '../../static/asset/svg/main/time.svg'
import like_img from '../../static/asset/svg/main/like.svg';
import MarkerImg from '../../static/asset/svg/main/marker2.svg';

//componenst
import Aside from '../../components/aside/Aside';
import BottomModal from '../../components/nav/BottomModal';
import ParkingItem from '../../components/items/ParkingItem';
import CircleButton from '../../components/button/CircleButton';
import AddressModal from '../../components/modal/AddressModal';
import BookmarkModal from '../../components/modal/BookmarkModal';
//lib
import {getDistanceFromLatLonInKm} from '../../lib/distance';
//action

import {set_position,set_level} from '../../store/user_position';
const cx = cn.bind(styles);

const MapContainer = ({modal}) => {


    const {position,level} = useSelector((state) => state.user_position);

    const dispatch = useDispatch();
    let position_ = useRef({lat :37.6219752405506 , lng : 127.16017523675508  });
    let level_ = useRef(5);
    let view_= useRef(false);
    const kakao_map = useRef(null);
    const history= useHistory();
    const [view,setView] = useState(false);

    const [modalState, dispatchHandle] = useReducer(
        (state, action) => {
            return {
                ...state,
                [action.type]: action.payload,
            };
        },
        { aside_: false, filter_: false },
    );

    const zoomMap = (type) => {

        let level = kakao_map.current.getLevel();
        level = type === 'zoomin' ? level - 1 : level + 1;
        kakao_map.current.setLevel(level, {
            animate: {
                duration: 300
            }
        });
        dispatch(set_level(level));
    }

    const mapRender =()=>{
        let container = document.getElementById("map");
        let lat = position.lat !==0 ? position.lat : position_.current.lat;
        let lng = position.lng !==0 ? position.lng : position_.current.lng;
        let options = {
            center: new kakao.maps.LatLng(lat, lng),
            level: level !== 0 ? level : level_.current,
        };

       
        const map = new kakao.maps.Map(container, options);
        kakao_map.current = map;

        var imageSrc = MarkerImg,
            imageSize = new kakao.maps.Size(120, 70),
            imageOption = { offset: new kakao.maps.Point(27, 69) };

        var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);

        kakao.maps.event.addListener(map, 'center_changed', function() {
            let level = map.getLevel();
            let latlng = map.getCenter();
            level_.current=level;
            position_.current.lat = latlng.getLat();
            position_.current.lng = latlng.getLng();
        
        });

        kakao.maps.event.addListener(map, 'click', function(mouseEvent) {        
            if(view_.current){
                view_.current= !view_.current;
                setView(view_.current);
            }            
        });


        markerdata.forEach((el) => {
            let content = `<span class="custom-overlay">${el.title}m</span>`;
            const marker = new kakao.maps.Marker({
                image: markerImage,
                map: map,
                position: new kakao.maps.LatLng(el.lat, el.lng),
                title: el.distance,
            });
            new kakao.maps.CustomOverlay({
                map:  map,
                position: new kakao.maps.LatLng(el.lat, el.lng),
                content: content,
                yAnchor: 1
            });
        
            kakao.maps.event.addListener(marker, 'click', function () {
                view_.current= !view_.current;
                // setView(view_.current);
                history.push(Paths.main.detail +`/${el.title}`)
            });
        });
    }

    useEffect(()=>{
        mapRender();
    },[])

    useEffect(()=>{
        return () => {
            dispatch(set_position(position_.current));
            dispatch(set_level(level_.current));
        }
    },[dispatch])

    useEffect(()=>{
        const lat1 = markerdata[0].lat;
        const lng1 =markerdata[0].lng;
        const lat2 = markerdata[2].lat;
        const lng2= markerdata[2].lng;
        getDistanceFromLatLonInKm(lat1,lng1,lat2,lng2);
    },)

    return (
        <>
            <div className={styles['container']}>
                <div className={styles['content']}>
                    <div id="map" style={{ width: "100vw", height: "100vh", zIndex: 1 }} />
                </div>

                <ButtonBase className={styles['menu']} onClick={() => { dispatchHandle({ type: 'aside_', payload: true }) }}>
                    <div className={styles['line-box']}>
                        <div className={styles['line']} />
                        <div className={styles['line']} />
                        <div className={styles['line']} />
                    </div>
                </ButtonBase>
                <div className={styles['search']} onClick={()=>history.push(Paths.main.index+'/address')}>
                    <ButtonBase className={styles['search-box']}>
                        위치를 입력해주세요
                    </ButtonBase>
                    <IconButton className={styles['search-btn']}>
                        <img src={search_icon} alt="search" />
                    </IconButton>
                </div>
                <div className={cx('side-bar', 'left')}>
                    <CircleButton src={zoom_in} onClick={() => { zoomMap('zoomin') }} />
                    <CircleButton src={zoom_out} onClick={() => { zoomMap('zoomout') }} />

                </div>
                <div className={cx('side-bar', 'right')}>
                    <CircleButton src={filter_img} onClick={() => { dispatchHandle({ type: 'filter_', payload: true }) }} />
                    <CircleButton src={time_img} />
                    <CircleButton src={like_img} onClick={()=>history.push(Paths.main.index +'/bookmark')}/>
                </div>      
                <Aside open={modalState.aside_} handleClose ={() => { dispatchHandle({ type: 'aside_', payload: false }) }}/>
                <ParkingItem onClick={()=>history.push(Paths.main.detail +'?id=1')} view={view}/>
            </div>
            <BottomModal open={modalState.filter_} handleClose={() => { dispatchHandle({ type: 'filter_', payload: false }) }} />
            <BookmarkModal open ={modal ==='bookmark'} handleClose={() =>history.goBack()}/>
            <AddressModal open ={modal==='address'} handleClose={() =>history.goBack()}/>
        </>
    );
};



const markerdata = [
    {
        title: "콜드스퀘어",
        distance : 300,
        lat: 37.62197524055062,
        lng: 127.16017523675508,
    },
    {
        title: "하남돼지집",
        distance : 300,
        lat: 37.620842424005616,
        lng: 127.1583774403176,
    },
    {
        title: "수유리우동",
        distance : 300,
        lat: 37.624915253753194,
        lng: 127.15122688059974,
    },
    {
        title: "맛닭꼬",
        distance : 300,
        lat: 37.62456273069659,
        lng: 127.15211256646381,
    },
];

export default MapContainer;