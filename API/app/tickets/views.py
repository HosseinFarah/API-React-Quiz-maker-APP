from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app, abort, jsonify
from flask_login import login_required, current_user
from app import db
from app.models import Ticket, User, TicketMessage
from .forms import TicketForm, UpdateTicketForm, AnswerTicketForm, UpdateTicketFormUser
import os
from werkzeug.utils import secure_filename
from . import tickets
from app.decorators import admin_required

@tickets.route('/create', methods=['GET', 'POST'])
@login_required
def create_ticket():
    form = TicketForm()
    if form.validate_on_submit():
        filename = None
        if form.image.data:
            filename = secure_filename(form.image.data.filename)
            form.image.data.save(os.path.join(current_app.config['TICKET_IMAGE_FOLDER'], filename))
        ticket = Ticket(title=form.title.data, description=form.description.data, image=filename, user_id=current_user.id)
        db.session.add(ticket)
        db.session.commit()
        flash('Your ticket has been created!', 'success')
        return redirect(url_for('tickets.view_tickets'))
    return render_template('tickets/create_ticket.html', title='Create Ticket', form=form)


@tickets.route('/update_ticket/<int:ticket_id>', methods=['GET', 'POST'])
@login_required
def update_ticket(ticket_id):
    ticket = Ticket.query.get_or_404(ticket_id)
    if ticket.user != current_user and not current_user.is_administrator():
        abort(403)
    if current_user.is_administrator():
        form = UpdateTicketForm()
    else:
        form = UpdateTicketFormUser()
        
    if form.validate_on_submit():
        ticket.title = form.title.data
        ticket.description = form.description.data
        if form.image.data:
            filename = secure_filename(form.image.data.filename)
            form.image.data.save(os.path.join(current_app.config['TICKET_IMAGE_FOLDER'], filename))
            ticket.image = filename
        if current_user.is_administrator():
            ticket.status = form.status.data
        db.session.commit()
        flash('Your ticket has been updated!', 'success')
        return redirect(url_for('tickets.view_tickets'))
    elif request.method == 'GET':
        form.title.data = ticket.title
        form.description.data = ticket.description
        if current_user.is_administrator():
            form.status.data = ticket.status  # Ensure status is always set for admin
    return render_template('tickets/update_ticket.html', title='Update Ticket', form=form, ticket=ticket)

@tickets.route('/view_tickets')
@login_required
def view_tickets():
    search = request.args.get('search', '').strip()
    page = request.args.get('page', 1, type=int)
    per_page = 5

    if current_user.is_administrator():
        query = Ticket.query
    else:
        query = Ticket.query.filter_by(user_id=current_user.id)

    if search:
        query = query.filter(
            Ticket.title.ilike(f'%{search}%') | 
            Ticket.description.ilike(f'%{search}%') | 
            Ticket.status.ilike(f'%{search}%')
        )

    tickets = query.order_by(Ticket.created_at.desc()).paginate(page=page, per_page=per_page)
    return render_template('tickets/view_tickets.html', title='Tickets', tickets=tickets, search=search)

@tickets.route('/view_ticket/<int:ticket_id>', methods=['GET', 'POST'])
@login_required
def view_ticket(ticket_id):
    ticket = Ticket.query.get_or_404(ticket_id)
    if not current_user.is_administrator() and ticket.user != current_user:
        abort(403)
    messages = TicketMessage.query.filter_by(ticket_id=ticket.id).order_by(TicketMessage.created_at.asc()).all()
    form = AnswerTicketForm()
    if form.validate_on_submit():
        message = TicketMessage(ticket_id=ticket.id, user_id=current_user.id, message=form.answer.data)
        db.session.add(message)
        db.session.commit()
        return redirect(url_for('tickets.view_ticket', ticket_id=ticket.id))
    return render_template('tickets/view_ticket.html', title='Ticket', ticket=ticket, messages=messages, form=form)

@tickets.route('/get_messages/<int:ticket_id>')
@login_required
def get_messages(ticket_id):
    ticket = Ticket.query.get_or_404(ticket_id)
    if not current_user.is_administrator() and ticket.user != current_user:
        abort(403)
    messages = TicketMessage.query.filter_by(ticket_id=ticket.id).order_by(TicketMessage.created_at.asc()).all()
    return jsonify([{
        'user': f"{message.user.firstname} {message.user.lastname}",
        'message': message.message,
        'created_at': message.created_at.strftime('%Y-%m-%d %H:%M:%S')
    } for message in messages])

@tickets.route('/answer_ticket/<int:ticket_id>', methods=['GET', 'POST'])
@login_required
def answer_ticket(ticket_id):
    ticket = Ticket.query.get_or_404(ticket_id)
    if not current_user.is_administrator() and ticket.user != current_user:
        abort(403)
    form = AnswerTicketForm()
    if form.validate_on_submit():
        message = TicketMessage(ticket_id=ticket.id, user_id=current_user.id, message=form.answer.data)
        db.session.add(message)
        db.session.commit()
        return redirect(url_for('tickets.view_ticket', ticket_id=ticket.id))
    return render_template('tickets/answer_ticket.html', title='Answer Ticket', form=form, ticket=ticket)


@tickets.route('/delete_ticket/<int:ticket_id>', methods=['POST', 'GET'])
@login_required
def delete_ticket(ticket_id):
    ticket = Ticket.query.get_or_404(ticket_id)
    if ticket.user != current_user and not current_user.is_administrator():
        abort(403)
    db.session.delete(ticket)
    db.session.commit()
    flash('Your ticket has been deleted!', 'success')
    return redirect(url_for('tickets.view_tickets'))

